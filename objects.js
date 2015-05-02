var express = require('express');
var forms = require('forms');
var csurf = require('csurf');
var collectFormErrors = require('express-stormpath/lib/helpers').collectFormErrors;
var stormpath = require('express-stormpath');
var extend = require('xtend');
var mongoose = require('mongoose');
var objectModel = require('./models/object.js');
var placementModel = require('./models/placement.js');

// Declare the schema of our form:

var objectForm = forms.create({
    name: forms.fields.string({
        required: true
    })
});


function renderListForm(req, res, objects) {
    res.render('objects/list', {
        title: 'Websites List',
        objects: objects
    });
}

function renderAddForm(req, res, locals) {
    res.render('objects/add', extend({
        title: 'Add new website'
    }, locals || {}));
}

function renderEditForm(req, res, object, locals) {
    var object_id = object._id;
    placementModel.find({object_id: object_id}, function (err, placements) {
        if (err) {
            res.send("Error getting placements from object");
            return;
        } else {
            res.render('objects/edit', extend({
            title: 'Edit website',
            name: object.name,
            id: object._id,
            placements: placements
        }, locals || {}));
        }
    })
    
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
        objectModel.find({username: username}, function(err, objects) {
            renderListForm(req, res, objects);
        });

        //next();
    });

    router.route('/add').all(function(req, res, next) {
        //res.send('add objects');
        objectForm.handle(req, {
            success: function(form) {
                var objectName = form.data.name;
                var username = req.user.username;

                var newObject = new objectModel({username: username, name: objectName});
                newObject.save(function(err) {
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
                        res.redirect('/objects');
                    }
                });
            },
            error: function(form) {
                // The form library calls this method if the form
                // has validation errors.  We will collect the errors
                // and render the form again, showing the errors
                // to the user
                renderAddForm(req, res, {
                    errors: collectFormErrors(form)
                });
            },
            empty: function() {
                // The form library calls this method if the
                // method is GET - thus we just need to render
                // the form
                renderAddForm(req, res);
            }
        });
    });

    router.route('/edit/:id').all(function(req, res, next) {
        var id = req.params.id;
        objectModel.findOne({_id: id}, function(err, object) {
            if (err) {
                res.end("Cannot find object with id: " + id);
            } else {
                objectForm.handle(req, {
                    success: function(form) {
                        var objectName = form.data.name;

                        var updateData = {name: objectName};

                        objectModel.update({_id: id}, updateData, function(err) {
                            if (err) {
                                if (err.developerMessage) {
                                    console.error(err);
                                }
                                renderEditForm(req, res, object, {
                                    errors: [{
                                            error: err.userMessage ||
                                                    err.message || String(err)
                                        }]
                                });
                            } else {
                                res.redirect('/objects');
                            }
                        });
                    },
                    error: function(form) {
                        renderAddForm(req, res, object, {
                            errors: collectFormErrors(form)
                        });
                    },
                    empty: function() {
                        renderEditForm(req, res, object);
                    }
                });
            }
        })

    });
    
    router.route('/delete/:id').get(function(req, res, next) {
        var id = req.params.id;
        objectModel.remove({_id: id}, function(err) {
            res.redirect('/objects');
        });

    });

    return router;
};