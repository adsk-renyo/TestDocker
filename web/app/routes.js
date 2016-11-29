// app/routes.js
express = require('express');
var bodyParser = require('body-parser'); //connects bodyParsing middleware
var busboy = require('connect-busboy'); //middleware for form/file upload
var path = require('path');     //used for file path
var dbAdapter = require('./dbAdapter');
var fs = require('fs-extra');    //File System-needed for renaming file etc
var Streamifier = require('streamifier');
var session = require('express-session');
var CoolbeeEvaluationLicense = require('./models/coolbeeEvaluationLicense');
var CoolbeeLicenseNonce = require('./models/coolbeeLicenseNonce');
var CoolbeeProductionLicense = require('./models/coolbeeProductionLicense');
var md5 = require("blueimp-md5");

auth = require('../config/auth')
module.exports = function (app, passport) {
    app.use("/assets", express.static(__dirname + '/../assets'));
    app.use("/vault", express.static(__dirname + '/../vault'));
    app.use(busboy());

    // Coolbee API
    // increate the usage count and return the usage count
    app.post('/api/evalLicense', function (req, res) {
        console.log('evalLicense = ' + req.body.appId);
        CoolbeeEvaluationLicense.findOne({ appId: req.body.appId }, function (err, doc) {
            if (!doc) {
                var evalLic = new CoolbeeEvaluationLicense();
                evalLic.appId = req.body.appId;
                evalLic.useCount = 1;
                evalLic.save(function (err) {
                    if (err) {
                        console.log("Error: evalLicense = " + err.toString());
                        res.json({ ret: false, reason: 'save evalLicense failed' });
                        return;
                    }
                    var mac = evalLic.appId.replace(new RegExp("-", 'g'), "");
                    var hash = md5(mac + evalLic.useCount.toString()).toUpperCase();
                    var retObj = { ret: true, appId: req.body.appId, evaluationToken: hash };
                    console.log('evalLicense on !doc: ', retObj);
                    res.json(retObj);
                    return;
                });
                return;
            }
            doc.useCount += 1;
            if (err)
                console.log(err);
            doc.save();
            var mac = doc.appId.replace(new RegExp("-", 'g'), "");
            var hash = md5(mac + doc.useCount.toString()).toUpperCase();
            var retObj = { ret: true, appId: doc.appId, evaluationToken: hash };
            console.log('evalLicense on doc: ', retObj)
            res.json(retObj);
        });
    });

    app.post('/api/exNonceLicense', function (req, res) {
        console.log('exNonceLicense = ' + req.body);
        // body {nonceGuid:String, softwareId: String, appVersion:String}
        CoolbeeLicenseNonce.findOne({ guid: req.body.nonceGuid }, function (err, nonceDoc) {
            if (err) {
                console.log('exNonceLicense err = ' + err);
            }
            if (!nonceDoc) {
                res.json({ ret: false, errCode: 1, reason: 'nonce ' + req.body.nonceGuid + ' does not exist' });
                return;
            } else if (nonceDoc.used) {
                res.json({ ret: false, errCode: 2, reason: 'nonce ' +  req.body.nonceGuid + ' has been used' });
                return;
            } else {
                // generate new license
                var softwareId = req.body.softwareId
                var appVersion = req.body.appVersion;
                CoolbeeProductionLicense.findOne({ softwareId: softwareId, appVersion: appVersion }, function (err, prodLicDoc) {
                    if (prodLicDoc) {
                        res.json({ ret: true, licenseData:prodLicDoc, extra:'eExistingLicense' });
                    } else {
                        var licenseGenFunc = function (id) {
                            var mac = id.replace(new RegExp("-", 'g'), "");
                            var salt = "renjiujiu2007";
                            var saltOffseted = "";
                            for (var i = 0; i < salt.length; ++i) {
                                var charCode = salt.charCodeAt(i);
                                saltOffseted += String.fromCharCode(charCode + 3);
                            }

                            console.log('offset = ' + saltOffseted);
                            var hash = md5(mac + saltOffseted).toUpperCase();
                            console.log('for md5 = ' + mac + saltOffseted);
                            console.log("hash value = " + hash);
                            return hash;
                        };
                        var newLic = new CoolbeeProductionLicense();
                        newLic.softwareId = softwareId;
                        newLic.appVersion = appVersion;
                        newLic.appLevel = "Professional";
                        newLic.user = null;
						newLic.nonce = nonceDoc.guid;
                        newLic.license = licenseGenFunc(softwareId);
                        newLic.save(function (err) {
                            if (err) {
                                console.log("Error: exNonceLicense = " + err.toString());
                                res.json({ ret: false, errCode:2, reason:'save license failed' });
                                return;
                            }
                            console.log("softwareId " + softwareId + ", lic = " + newLic.license);
                            nonceDoc.used = true;
                            nonceDoc.save();
                            res.json({ ret: true, licenseData: newLic, extra:'eNewLicense' });
                        });
                    } //else
                });
            }
        });
    });
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function (req, res) {
        res.redirect('/home');
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function (req, res) {
        res.render('login.ejs', { isLoggedIn: req.isAuthenticated(), user: req.user, message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function (req, res) {
        res.render('signup.ejs', { isLoggedIn: req.isAuthenticated(), user: req.user, message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', function (req, res, next) {
        passport.authenticate('local-signup', function (err, user, info) {
            if (err) {
                res.json({ success: false, message: err });
            }
            else if (!user) {
                res.json({ success: false, message: info });
            }
            else {
                res.json({ success: true, message: "signed up " });
            }
        })(req, res, next);
    });

    // process the signup form
    app.post('/createPortal', function (req, res) {
        auth.createPortal(req, res);
    });
    app.post('/redirectCreatePortal', function (req, res) {
        res.redirect('/myPortal');
    });
    // =====================================
    // PROFILE SECTION =========================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('profile.ejs', { isLoggedIn: req.isAuthenticated(), user: req.user });
    });

    app.get('/home', function (req, res) {
        res.render('home.ejs', { isLoggedIn: req.isAuthenticated(), user: req.user });
    });

    app.get('/myPortal', function (req, res) {
        var user = req.user;
        var colladaParts = [];
        if (user) {
            dbAdapter = require('./dbAdapter');
            dbAdapter.getUserModels(user._id).then(function (warehouseItems) {
                colladaParts = warehouseItems;
                console.log('parts = ' + colladaParts);
                res.render('myPortal.ejs', { isLoggedIn: req.isAuthenticated(), user: user, colladaParts: colladaParts });
            }).catch(function (err) {
                console.log('err parts = ' + colladaParts);
                res.render('myPortal.ejs', { isLoggedIn: req.isAuthenticated(), user: user, colladaParts: colladaParts });
            });
        } else {
            console.log('err1 parts = ' + colladaParts);
            res.render('myPortal.ejs', { isLoggedIn: req.isAuthenticated(), user: user, colladaParts: colladaParts });
        }
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/user', function (req, res) {
        res.render('user.ejs', { isLoggedIn: req.isAuthenticated(), user: req.user });
    });
    app.get('/help', function (req, res) {
        res.render('help.ejs', { isLoggedIn: req.isAuthenticated(), user: req.user });
    });
    app.get('/HousebangVideos', function (req, res) {
        res.render('HousebangVideos.ejs', { isLoggedIn: req.isAuthenticated(), user: req.user });
    });
    app.get('/createPortal', function (req, res) {
        res.render('createPortal.ejs', { isLoggedIn: req.isAuthenticated(), user: req.user });
    });

    app.post('/uploadModel', function (req, res, next) {
        var userid = req.user._id;
        var fstream;
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            console.log("Uploading: " + filename);
            dbAdapter.uploadModel(userid, file, filename, ['part', 'collada'], null, 'name', ['bedroom', 'bed'],
                { type: 'text', content: 'description' }, __dirname + '/../vault/part/', null, null).then(function (warehouseItem) {
                    console.log("Upload Finished of " + filename);
                    res.json({ success: true, message: warehouseItem });          //where to go next                    
                }).catch(function (err) {
                    console.log('Error: in uploadModel = ' + err);
                    res.redirect('back');
                });
        });
    });

    app.post('/updateWarehouseItem', function (req, res, next) {
        var user = req.user;
        var portalName = req.body.name;
        var portalFullName = req.body.fullName;
        var warehouseId = req.body.warehouseInfo._id;
        // set session cookie warehouseId that uploadPartThumbnail can use to 
        // avoid set warehouseId uploadPartThumbnail
        req.session.warehouseId = warehouseId;
        req.session.originalFileName = req.body.warehouseInfo.originalFileName;
        req.session.partId = req.body.warehouseInfo.partId;
        console.log('updateWarehouseItem id = ' + warehouseId);
        console.log('updateWarehouseItem name = ' + req.body.warehouseInfo.name);
        console.log('updateWarehouseItem description = ' + req.body.warehouseInfo.description);
        console.log('updateWarehouseItem tags = ' + req.body.warehouseInfo.tags);
        req.body.warehouseInfo.updateDate = Date.now();
        dbAdapter.updateWarehouseItem(warehouseId, req.body.warehouseInfo).then(function (numUpdatedPart) {
            res.json({ success: true, message: warehouseId });
        }).catch(function (err) {
            console.log('Error: in updateWarehouseItem = ' + err);
            res.json({ success: false, message: err });
        });
    });

    app.post('/uploadPartThumbnail', function (req, res, next) {
        var reqPayload = '';
        req.on('data', function (data) {
            reqPayload += data;
        });
        req.on('end', function () {
            var data = reqPayload.replace(/^data:image\/\w+;base64,/, "");
            var buf = new Buffer(data, 'base64');
            var targetFolder = __dirname + '/../vault/part/';
            var warehouseId = req.session.warehouseId;
            var originalFileName = req.session.originalFileName;
            console.log(' orgId = ' + originalFileName);
            if (!warehouseId) {
                var errmsg = 'client should pass warehouseId as cookie';
                console.log(errmsg);
                res.json({ success: false, message: errmsg });
            }
            console.log('uploadPartThumbnail warehouse id = ' + warehouseId);
            return dbAdapter.updatePartThumbnail(warehouseId, buf, '.png', targetFolder).then(function (uuidThumbnail) {
                // don't keep warehouseId session cookie anymore
                res.json({
                    success: true, message: {
                        warehouseId: warehouseId, thumbnailId: uuidThumbnail,
                        originalFileName: req.session.originalFileName, partId: req.session.partId
                    }
                });
                delete req.session.warehouseId;
            }).catch(function (err) {
                console.log('Error: in uploadPartThumbnail = ' + err);
                res.json({ success: false, message: err });
                delete req.session.warehouseId;
            });
        });
    });
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
