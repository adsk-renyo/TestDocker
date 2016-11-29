var mongoose = require('mongoose');

// misc contains extra information. for example, for model, contains bounind box, archor point, coordination
// type can be [part, collada, ...], [image, 'jpg']
// owner is the user id
// file is unique and indexed
// originalUuidfile can be null if it is exactly the same as file
// for example, client uploads a zipped collada model with name table.zip
// then table.zip is actually saved as abcd_uuid.zip in the sever to avoid name confliction
// in this case: file = abcd_uuid.zip; originalFileName = table.zip; originalUuidfile is undefined
// another example, client uploads table.skp (sketchup file) and it is translated to 
// abcd_uuid.zip collada model in the server. then:
// file = abcd_uuid.zip; originalFileName = table.skp; originalUuidfile = some_uuid.skp
// originalFileName is the original file name from client
// description => {type:text or html, content:string}
var warehouseSchema = mongoose.Schema({
    file:               {type:String, index: { unique: true }},
    type:               [String],
    originalFileName:   String,
    originalUuidfile:   String,
    thumbnailFile:      String,
    name:               String,
    tags:               [String],
    description:        mongoose.Schema.Types.Mixed,
    owner:              {type:mongoose.Schema.Types.ObjectId, index:true},
    createDate:         Date,
    updateDate:         Date,
    misc:               mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
