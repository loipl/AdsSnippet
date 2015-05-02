var express = require('express');
var forms = require('forms');
var csurf = require('csurf');
var collectFormErrors = require('express-stormpath/lib/helpers').collectFormErrors;
var stormpath = require('express-stormpath');
var extend = require('xtend');
var mongoose = require('mongoose');
var objectModel = require('./models/object.js');
var placementModel = require('./models/placement.js');
var config = require('./config.js');

// Declare the schema of our form:

var placementForm = forms.create({
    name: forms.fields.string({
        required: true
    }),
    html: forms.fields.string({
        required: true
    })
});


function renderListForm(req, res, placements, objects) {
    res.render('placements/list', {
        title: 'Placements List',
        placements: placements,
        objects: objects
    });
}

function renderAddForm(req, res, locals) {
    res.render('placements/add', extend({
        title: 'Add new placement',
        object_id: req.query.object_id
    }, locals || {}));
}

function renderEditForm(req, res, placement, locals) {
    res.render('placements/edit', extend({
        title: 'Edit placement',
        name: placement.name,
        html: placement.html,
        object_id: placement.object_id
    }, locals || {}));
}

function generateSnipet(id) {
    var httpHost  = 'http://' + config.getHostName() + ':' + config.httpPort;
    var httpsHost = 'https://' + config.getHostName() + ':' + config.httpsPort;
    var main_div_id = 'adserver_placement_' + id;
    var code = '<div id="' + main_div_id + '"></div>' + 
               '<script>' + 
               'var xmlhttp = new XMLHttpRequest();' +
               'if (location.protocol === "https:") ' +
               'xmlhttp.open("GET","' + httpsHost + '/code/' + id + '",false);' + 
               'else ' +
               'xmlhttp.open("GET","' + httpHost + '/code/' + id + '",false);' + 
               'xmlhttp.send();' + 
               'document.getElementById("' + main_div_id + '").innerHTML = xmlhttp.responseText;' + 
               '</script>';
    return code;
}

// Export a function which will create the
// router and return it

module.exports = function profile() {

    var router = express.Router();


    router.all('/*', stormpath.loginRequired, function(req, res, next) {
        next();
    });


    router.get('/', function(req, res, next) {
        //res.send('list objects');
        var username = req.user.username;
        placementModel.find({username: username}, function(err, placements) {
            objectModel.find({username:username}, function(err2, objects) {
                renderListForm(req, res, placements, objects);
            });
        });

        //next();
    });

    router.route('/add').all(function(req, res, next) {
        var object_id = req.query.object_id;
        
        if (!object_id) {
            res.redirect('/placements');
        }
        
        placementForm.handle(req, {
            success: function(form) {
                var placementName = form.data.name;
                var html          = form.data.html;
                var username      = req.user.username;
                var id = mongoose.Types.ObjectId();
                var snipet = generateSnipet(id);

                var newPlacement = new placementModel({
                    _id: id,
                    snipet: snipet,
                    username: username, 
                    object_id: object_id, 
                    name: placementName, 
                    html: html
                });
                newPlacement.save(function(err) {
                    if (err) {
                        if (err.developerMessage) {
                            console.error(err);
                        }
                        renderAddForm(req, res, {
                            errors: [{
                                    error: err.userMessage ||
                                            err.message || String(err)
                                }]
                        });
                    } else {
                        res.redirect('/objects/edit/' + object_id);
                    }
                });
            },
            error: function(form) {
                var formErrors = form.data.name ? collectFormErrors(form) : {};
                renderAddForm(req, res, {
                    errors: formErrors
                });
            },
            empty: function() {
                renderAddForm(req, res);
            }
        });
    });

    router.route('/edit/:id').all(function(req, res, next) {
        var id = req.params.id;
        placementModel.findOne({_id: id}, function(err, placement) {
            if (err) {
                res.end("Cannot find placement with id: " + id);
            } else {
                placementForm.handle(req, {
                    success: function(form) {
                        var placementName = form.data.name;
                        var html          = form.data.html;

                        var updateData = {name: placementName, html: html};

                        placementModel.update({_id: id}, updateData, function(err) {
                            if (err) {
                                if (err.developerMessage) {
                                    console.error(err);
                                }
                                renderEditForm(req, res, placement, {
                                    errors: [{
                                            error: err.userMessage ||
                                                    err.message || String(err)
                                        }]
                                });
                            } else {
                                res.redirect('/objects/edit/' + placement.object_id);
                            }
                        });
                    },
                    error: function(form) {
                        renderAddForm(req, res, placement, {
                            errors: collectFormErrors(form)
                        });
                    },
                    empty: function() {
                        renderEditForm(req, res, placement);
                    }
                });
            }
        })

    });
    
    router.route('/delete/:id').get(function(req, res, next) {
        var id = req.params.id;
        placementModel.remove({_id: id}, function(err) {
            var object_id = req.query.object_id;
            if (typeof object_id !== 'undefined') {
                res.redirect('/objects/edit/' + object_id);
            } else {
                res.redirect('/placements');
            }
            
        });

    });

    return router;
};