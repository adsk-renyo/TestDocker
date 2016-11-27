// 
var mongoose = require('mongoose');

var coolbeeLicenseNonceSchema = mongoose.Schema({
    guid: String,
    used: Boolean,
    distributed: { type: Boolean, default: false },
    user: mongoose.Schema.Types.ObjectId,
    createDate: { type: Date, default: Date.now },
    lastAccessDate: { type: Date, default: Date.now }
}, { collection: 'coolbeeLicenseNonces' });

module.exports = mongoose.model('CoolbeeLicenseNonce', coolbeeLicenseNonceSchema);
