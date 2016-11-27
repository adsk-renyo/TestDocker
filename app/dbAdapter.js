var User = require('./models/user');
var UserLog = require('./models/userLog');
var Portal = require('./models/portal');
var PortalLog = require('./models/portalLog');
var Warehouse = require('./models/warehouse');
var assert = require('assert');
var fs = require('fs-extra');    //File System-needed for renaming file etc
var path = require('path');
var Promise = require('bluebird');
var util = require('./util')

var createUser = function (username, firstName) {
    console.log("create user for " + username);
    return new Promise(function (resolve, reject) {
        var newUser = new User();
        // set the user's local credentials
        newUser.local.username = username;
        newUser.local.password = newUser.generateHash('password'); // use the generateHash function in our user model
        newUser.local.email = 'renyongfu@hotmail.com';
        newUser.local.firstName = firstName;
        // save the user
        newUser.save(function (err) {
            if (err)
                reject(err);
            var newUserLog = new UserLog();
            newUserLog.user = newUser._id;
            newUserLog.createDate = newUserLog.updateDate = newUserLog.lastAccessDate = Date.now();
            newUserLog.save(function (err) {
                if (err)
                    reject(err);
                resolve(newUser);
            });
        });
    });
}

var updateUserPortal = function (user, portal) {
    console.log("updateUserPortal " + user._id);
    return new Promise(function(resolve, reject) {
        User.update({ _id: user._id },
        { $set: { 'local.portal': portal._id} },
        function (err, numberAffect) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log('success in create portal & update user = ' + numberAffect.toString());
                var now = Date.now();
                UserLog.update({ user: user._id }, { $set: { updateDate: now, lastAccessDate: now} }, function (err, numberAffect) {
                    if (err)
                        reject(err);
                    resolve(user);
                });
            }
        });       
    });
}

/// createPortal also update the user's portal field 
var createPortal = function (userArray, portalName, portalFullName) {
    console.log("createPortal for " + portalName);
    return new Promise(function(resolve, reject) {
        var newPortal = new Portal();
        newPortal._id = portalName;
        newPortal.fullName = portalFullName;
        newPortal.users = userArray;

        newPortal.save(function (err) {
            if (err) {
                reject(err);
            } else {
                var newLog = new PortalLog();
                newLog.portal = newPortal._id;
                newLog.createDate = newLog.updateDate = newLog.lastAccessDate = Date.now();
                newLog.save(function (err) {
                    if (err)
                        reject(err);
                    Promise.all(userArray.map(function(user) {return updateUserPortal(user, newPortal);}
                    )).then(function(updatedUsers){
                        resolve(newPortal);
                    }, function(err) {
                        reject(err);
                    });                    
                });                
            }
        });       
    });
}

var createWarehouseItem = function (ownerId, uuidFile, originalFileName, type, misc, name, tags, description, thumbnailFile) {
    return new Promise(function (resolve, reject) {
        var newItem = new Warehouse();
        newItem.file = uuidFile;
        newItem.originalFileName = originalFileName;
        newItem.owner = ownerId;
        newItem.type = type;
        newItem.name = name || '';
        newItem.misc = misc || {};
        newItem.tags = tags || [];
        newItem.description = description || '';
        newItem.createDate = newItem.updateDate = Date.now();
        if (thumbnailFile)
            newItem.thumbnailFile = thumbnailFile;
        newItem.save(function (err) {
            if (err) {
                console.log("Error: createWarehouseItem = " + err.toString());
                reject(err)
            }
            console.log("ware house is updated for " + originalFileName + " as file " + uuidFile);
            resolve(newItem);
        });
    });
}

// see warehouseSchema
var updateWarehouseItem = function (warehouseId, newInfo) {
    return new Promise(function(resolve, reject){
        Warehouse.update({ _id: warehouseId }, { $set: newInfo}, function (err, numberOfUpdates) {
            if (err) {
                console.log("Error in Warehouse.update = " + err);
                reject(err);
            }
            console.log("Warehouse.update result = " + numberOfUpdates);
            resolve(numberOfUpdates);
        });
    });
}

var uploadModel = function (ownerId, inputFileStream, inputFilename, type, misc, name, tags, description, targetFolder, inputThumbFileStream, inputThumbFileExtension) {
    return new Promise(function(resolve, reject) {
        var uuid = util.generateUUID();
        var uuidFile = uuid + path.extname(inputFilename);

        var fstream = fs.createWriteStream(targetFolder + uuidFile);
        inputFileStream.pipe(fstream);
        fstream.on('close', function () {
            console.log("Upload Finished of " + inputFilename + " as file " + uuidFile);
            if (inputThumbFileStream) {
                if (!inputThumbFileExtension)
                    console.log('inputThumbFileExtension is null');
                uuid = util.generateUUID();
                var uuidThumb = uuid + inputThumbFileExtension;
                var thumbFStream = fs.createWriteStream(targetFolder + uuidThumb);
                inputThumbFileStream.pipe(thumbFStream);
                thumbFStream.on('close', function () {
                    createWarehouseItem(ownerId, uuidFile, inputFilename, type, misc, name, tags, description, uuidThumb).then(function(warehouseItem) {
                        resolve(warehouseItem);
                    }, function(err) {
                        reject(err);
                    });
                });
            } else {
                console.log("To create warehouse item " + inputFilename + " as file " + uuidFile);
                createWarehouseItem(ownerId, uuidFile, inputFilename, type, misc, name, tags, description, null).then(function(warehouseItem) {
                    resolve(warehouseItem);
                }, function(err) {
                    reject(err);
                });
            }
        });        
    });
}

var getUserModels = function (userId) {
    return new Promise(function(resolve, reject) {
        Warehouse.find({ owner: userId }).sort({updateDate:-1}).exec(function (err, warehouseItems) {
            if(err)
                reject(err);
            resolve(warehouseItems);
        });        
    });
}

var updatePartThumbnail = function (warehouseId, inputThumbFileStream, inputThumbFileExtension, targetFolder) {
    // warehouseId is of type of ObjectID
    console.log('TO updatePartThumbnail for warehouse id = ' + warehouseId + ' id class name = ' + util.getClassName(warehouseId));
    return new Promise(function (resolve, reject) {
        Warehouse.findById(warehouseId, 'thumbnailFile').exec(function (err, item) {
            // delete old thumb first
            if (err) {
                console.log(err);
                reject(err);
            }
            if (item && item.thumbnailFile) {
                var oldFileName = targetFolder + item.thumbnailFile;
                console.log('delete old file at ' + oldFileName);
                fs.unlinkSync(oldFileName);
            }

            var updateFunction = function (uuidThumb) {
                console.log("Thumbnail upload Finished as file " + uuidThumb);
                Warehouse.update({ _id: warehouseId }, { $set: { thumbnailFile: uuidThumb} }, function (err, numberOfUpdates) {
                    if (err) {
                        console.log("Error in Warehouse.update = " + err);
                        reject(err);
                    }
                    console.log("Warehouse.update thumb = " + uuidThumb);
                    resolve(uuidThumb);
                });
            }
            // create new thumb
            if (inputThumbFileStream) {
                if (!inputThumbFileExtension)
                    console.log('inputThumbFileExtension is null');
                uuid = util.generateUUID();
                var uuidThumb = uuid + inputThumbFileExtension;
                if (inputThumbFileStream.pipe) {
                    var thumbFStream = fs.createWriteStream(targetFolder + uuidThumb);
                    inputThumbFileStream.pipe(thumbFStream);
                    thumbFStream.on('close', function () {
                        updateFunction(uuidThumb);
                    });
                } else {
                    fs.writeFile(targetFolder + uuidThumb, inputThumbFileStream, function (err) {
                        if (err) {
                            reject(err);
                        }
                        updateFunction(uuidThumb);
                    });
                }
            } else {
                console.log("To update warehouse item to delete thumbnail");
                Warehouse.update({ _id: warehouseId }, { $unset: { thumbnailFile: ""} }, function (err, numberOfUpdates) {
                    if (err)
                        reject(err);
                    resolve(numberOfUpdates);
                });
            }
        });
    });
}


module.exports = {
    createUser: createUser,
    updateUserPortal: updateUserPortal,
    createPortal: createPortal,
    createWarehouseItem: createWarehouseItem,
    updateWarehouseItem: updateWarehouseItem,
    uploadModel: uploadModel,
    getUserModels: getUserModels,
    updatePartThumbnail: updatePartThumbnail
};