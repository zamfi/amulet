var reader = require('./reader');

var opened = reader.start(function(tagId) {
  console.log("Checking tag:", tagId);
});
opened.then(function() {
  console.log("RFID reader online...");
}, function(err) {
  console.log("RFID reader failed to open", err);
  process.exit(1); // exit with error
});
