var express = require('express');
var stormpath = require('express-stormpath');
var mongoose = require('mongoose');
var config   = require('./config.js');
var connect = require('connect')
var serveStatic = require('serve-static');
var https = require('https');
var http = require('http');
var fs = require('fs');
var consts = require('./consts.js');

mongoose.connect(config.getDBConnection(), function(err) {
    if (err)
        console.log('Cannot connect to mongo db');
});

var app = express();
app.set('views', './views');
app.set('view engine', 'jade');

app.use(stormpath.init(app, {
    apiKeyFile: 'key/apiKey.properties',
    application: 'https://api.stormpath.com/v1/applications/5qltxf9k99KvYgwZhoHBFP',
    secretKey: 'mdfgmvdsnva12rrsdgmd',
	expandCustomData: true,
	enableForgotPassword: true
}));

app.get('/', function(req, res) {
  res.render('home', {
    title: 'Welcome',
    consts: consts
  });
});

app.use('/profile',require('./profile')());
app.use('/objects',require('./objects')());
app.use('/placements',require('./placements')());
app.use('/code',require('./code')());

app.use('/public', serveStatic('public'));

var httpsOptions = {
  key: fs.readFileSync('key/agent2-key.pem'),
  cert: fs.readFileSync('key/agent2-cert.pem')
};

http.createServer(app).listen(config.httpPort);
https.createServer(httpsOptions, app).listen(config.httpsPort);
// app.listen(3000);