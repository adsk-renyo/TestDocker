// 
var mongoose = require('mongoose');

var coolbeeEvaluationLicenseSchema = mongoose.Schema({
    appId: String,
    useCount: Number,
    createDate: { type: Date, default: Date.now },
    lastAccessDate: { type: Date, default: Date.now }
}, { collection: 'coolbeeEvaluationLicenses' });

module.exports = mongoose.model('CoolbeeEvaluationLicense', coolbeeEvaluationLicenseSchema);
