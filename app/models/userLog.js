var mongoose = require('mongoose');

// log user access
var userLogSchema = mongoose.Schema({
        user:           {type:mongoose.Schema.Types.ObjectId, index: { unique: true }},
        createDate:     Date,
        updateDate:     Date,
        lastAccessDate: Date,
        misc:           mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('UserLog', userLogSchema);
