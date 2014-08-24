var Q = require('q');
var fs = require('fs');

var members = JSON.parse(fs.readFileSync('data/members.json')).members;
var events = JSON.parse(fs.readFileSync('data/events.json')).events;

var ERRORS = exports.ERRORS = {
  NO_SUCH_MEMBER: 1
}

exports.getMemberByTag = function(tagId) {
  var deferred = Q.defer();

  var member = members.filter(function(member) {
    return member.tagId == tagId;
  })[0];
  if (member) {
    deferred.resolve(member);
  } else {
    deferred.reject(ERRORS.NO_SUCH_MEMBER);
  }
  
  return deferred.promise;
}

exports.getMemberById = function(userId) {
  var deferred = Q.defer();

  var member = members.filter(function(member) {
    return member.id == userId;
  })[0];
  if (member) {
    deferred.resolve(member);
  } else {
    deferred.reject(ERRORS.NO_SUCH_MEMBER);
  }
  
  return deferred.promise;  
}

// returns information 
exports.getMemberDisplayData = function(userId) {
  return exports.getMemberById(userId).then(function(member) {
    var deferred = Q.defer();
    
    deferred.resolve({
      member: member,
      events: events.filter(function(event) {
        return event.tags.some(function(tag) {
          return member.tags.indexOf(tag) >= 0;
        });
      })
    });
    
    return deferred.promise;
  });
}

exports.purchaseEvents = function(memberId, eventIdArray) {
  var deferred = Q.defer();
  
  setTimeout(function() {
    deferred.resolve({
      status: 'ok'
    });    
  }, 10*1000);
  
  return deferred.promise;
}

console.log("known members", members);