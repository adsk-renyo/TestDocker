// warehouseDerivate saves derivative information of a warehouse item
// for example, different resolution of a 3D part
// misc contains extra information. for example, for model, contains bounind box, archor point, coordination
// parent is the id of warehouse item id
// type and misc can be inherited from parent if not overriden
// file and thumbnailFile (if exists) should be uuid named to avoid conflict
var mongoose = require('mongoose');

var warehouseDerivativeSchema = mongoose.Schema({
    file:               {type:String, unique:true},
    thumbnailFile:      String,
    type:               String,
    parent:             {type:mongoose.Schema.Types.ObjectId, index: true},
    misc:               mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('WarehouseDerivative', warehouseDerivativeSchema);
