var express = require('express');
var mongoose = require('mongoose');
var placementModel = require('./models/placement.js');
var config = require('./config.js');


function renderForm(req, res, placement) {
    res.render('code', {
        placement: placement,
        hostname : 'http://' + config.getHostName() + ':' + config.httpPort,
    });
}


// Export a function which will create the
// router and return it

module.exports = function profile() {

    var router = express.Router();

    router.get('/:id', function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        placementModel.findOne({_id: req.params.id}, function(err, placement) {
            if(err || !placement) {
                res.end("Couldnot find placement with specified id");
            } else {
                res.end(placement.html);
                //renderForm(req, res, placement);
            }
        });

        //next();
    });

    return router;
};