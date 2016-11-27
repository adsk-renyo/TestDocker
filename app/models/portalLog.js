var mongoose = require('mongoose');

// log portal access
var portalLogSchema = mongoose.Schema({
        portal:         {type:String, index: { unique: true }},
        createDate:     Date,
        updateDate:     Date,
        lastAccessDate: Date,
        misc:           mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('PortalLog', portalLogSchema);
