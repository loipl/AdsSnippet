var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ObjectSchema   = new Schema({
    username: String,
    name: String
});

module.exports = mongoose.model('Objects', ObjectSchema);