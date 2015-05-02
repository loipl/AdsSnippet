var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var PlacementSchema   = new Schema({
    username: String,
    object_id: String,
    name: String,
    html: String,
    snipet: String
});

module.exports = mongoose.model('Placements', PlacementSchema);