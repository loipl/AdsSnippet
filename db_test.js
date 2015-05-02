var mongoose    = require('mongoose');
var connection  = require('./dbconfig.js').getConnectionUrl();
mongoose.connect(connection);

var Cat = mongoose.model('Cat', { name: String });


//var kitty = new Cat({ name: 'Diep' });
//kitty.save(function (err) {
//  if (err) console.log('error')
//  console.log('meow');
//});

//Cat.update({_id: '54ba391e5dbadef41bc67b55'}, {name: 'Meowth'}, {multi: false}, function(err, numAffected) {
//    if (err) {
//        var message = "Error: " + (err.message || 'Unknown err');
//        console.log(message);
//    } else {
//        console.log ("Update " + numAffected + " rows");
//    }
//})


Cat.find({}, function (err, cats) {
    console.log(cats);
})