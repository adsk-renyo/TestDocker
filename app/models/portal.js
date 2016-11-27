var mongoose = require('mongoose');

// portal privide public access for app
// portal name is used as _id
var portalSchema = mongoose.Schema({
        _id:           {type:String, index: { unique: true, required: true }},
        fullName:       String,
        users:          [mongoose.Schema.Types.ObjectId],
        misc:           mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Portal', portalSchema);
