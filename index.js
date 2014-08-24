var fs = require('fs');
var https = require('https');
var express = require('express');
var reader = require('./reader');


// handle tags
var membership = require('./membership');

var opened = reader.start(function(tagId) {
  membership.getMemberByTag(tagId).then(function(member) {
    console.log("Member tagged in!", member);
  }, function(error) {
    if (error == membership.ERRORS.NO_SUCH_MEMBER) {
      console.log("Not a member:", "'"+tagId+"'", typeof(tagId));
    } else {
      console.log("Unknown error:", error);
    }
  });
});
opened.then(function() {
  console.log("RFID reader online...");
}, function(err) {
  console.log("RFID reader failed to open", err);
  process.exit(1); // exit with error
});



// serve additional info about members.
var app = express();

var sharedSecret = "O[RVeWmPrm4OIzmXz&C}w-CM!m:f7*I";

app.use(function(req, res, next) {
  if (req.param('shared_secret') != sharedSecret) {
    res.send(401, {status: 'error', data: 'missing-key'});
    console.warn("Unauthorized request from", req.ip);
  } else {
    next();
  }
});

app.get('/', function(req, res) {
  res.end('<h1>This is an API endpoint. What are you trying to pull?</h1>');
});

app.get('/getMemberDisplayData', function(req, res, next) {
  membership.getMemberDisplayData(req.param('id')).then(function(data) {
    res.json({status: 'ok', data: data});
  }, function(error) {
    if (error == membership.ERRORS.NO_SUCH_MEMBER) {
      res.json({status: 'error', data: 'no-such-member'});
    } else {
      res.send(500, { status: 'error', data: 'unkonwn error, see console'});
      console.warn("Failed on member data request for id", req.param('id'), "error:", error);
    }
  });
});

app.post('/purchaseEvents', function(req, res, next) {
  membership.purchaseEvents(req.param('memberId'), req.param('events')).then(function(data) {
    res.json(data);
  });
})

var PORT = 8000;

var options = {
    key: fs.readFileSync('./ssl/privatekey.pem'),
    cert: fs.readFileSync('./ssl/certificate.pem'),
};

var server = https.createServer(options, app).listen(PORT, function(){
  console.log("Express server listening on port " + PORT);
});