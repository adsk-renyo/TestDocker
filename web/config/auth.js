// load up the user model
var dbAdapter = require('../app/dbAdapter');

module.exports.createPortal = function (req, res) {
    var user = req.user;
    var portalName = req.body.name;
    var portalFullName = req.body.fullName;
    if (user.local.portal.length > 0) {
        console.log("user already has a portal");
        return res.json({ success: false, message: "user already has a portal" });
    }

    dbAdapter.createPortal([user], portalName, portalFullName
    ).then(function(newPortal) {
        res.json({success:true, message:portalName});
    }).catch(function(err) {
        if(err.name && err.name == "MongoError" && err.code && err.code == 11000) {
            res.json({success:false, message:'Error: portal name "' + portalName + '" already exists!'});               
        } else {
            res.json({success:false, message:"Internal Error"});            
        }
    });
}
