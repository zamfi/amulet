var fs = require('fs');
var https = require('https');
var express = require('express');
var reader = require('./reader');
var Q = require('q');

var tagCheckinData = [];

// handle tags
var membership = require('./membership');

var opened = reader.start(function(tagId) {
  membership.getMemberByTag(tagId).then(function(member) {
    tagCheckinData.push({id: tagId, date: Date.now()});
    console.log("Member tagged in!", member);
  }, function(error) {
    if (error == membership.ERRORS.NO_SUCH_MEMBER) {
      console.log("Not a member:", tagId.split(''));
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
    res.json(401, {status: 'error', data: 'missing-key'});
    console.warn("Unauthorized request from", req.ip, req.query);
  } else {
    next();
  }
});

app.get('/', function(req, res) {
  res.end('<h1>This is an API endpoint. What are you trying to pull?</h1>');
});

function displayDataForTags(tags) {
  return Q.all(tags.map(function(tag) {
    return membership.getMemberByTag(tag.id).get('id').then(function(userId) {
      return {id: userId, date: tag.date};
    });
  }));
}

app.get('/checkForTags', function(req, res, next) {
  var lastCheck = Number(req.param('since'));
  console.log("checking for tags since", lastCheck);
  if (lastCheck == 0) {
    displayDataForTags(tagCheckinData).then(function(data) {
      console.log("found tags!", data);
      res.json({status: 'ok', tags: data});      
    });
    return;
  }
  for (var i = tagCheckinData.length-1; i >= 0; i--) {
    if (tagCheckinData[i].date <= lastCheck) {
      console.log("checking for tags! found", tagCheckinData.slice(i+1));
      displayDataForTags(tagCheckinData.slice(i+1)).then(function(data) {
        console.log("found tags!", data);
        res.json({status: 'ok', tags: data});              
      });
      return;
    }
  }
  // console.log("no tags found!");
  displayDataForTags(tagCheckinData).then(function(data) {
    console.log("found tags!", data);
    res.json({status: 'ok', tags: data});      
  });
});

app.get('/getMemberDisplayData', function(req, res, next) {
  console.log("get member display data for", req.param('id'));
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

if (process.env.NODE_ENV == 'production') {
  var options = {
      key: fs.readFileSync('./ssl/privatekey.pem'),
      cert: fs.readFileSync('./ssl/certificate.pem'),
  };

  var server = https.createServer(options, app).listen(PORT, function(){
    console.log("Express server listening on port " + PORT);
  });  
} else {
  app.listen(PORT, function() {
    console.log("Express server listening on port " + PORT);
  });
}
