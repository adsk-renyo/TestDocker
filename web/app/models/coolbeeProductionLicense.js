// 
var mongoose = require('mongoose');

var coolbeeProductionLicenseSchema = mongoose.Schema({
    softwareId: String,
    appVersion: String,
    appLevel: String,
    license: String,
    user: mongoose.Schema.Types.ObjectId,
    nonce: { type: String, default: '' },
    createDate: { type: Date, default: Date.now },
    lastAccessDate: { type: Date, default: Date.now }
}, { collection: 'coolbeeProductionLicenses' });

module.exports = mongoose.model('CoolbeeProductionLicense', coolbeeProductionLicenseSchema);
