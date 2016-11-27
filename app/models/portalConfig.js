var mongoose = require('mongoose');

// portalConfig organizes data owned by users for the presentation in app
var portalConfigSchema = mongoose.Schema({
    portal:             {type : String, index:{ unique: true }},
    appConfig:          mongoose.Schema.Types.Mixed,
    misc:               mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('PortalConfig', portalConfigSchema);
