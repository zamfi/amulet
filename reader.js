var Q = require('q');
var apn = require('apn');
var serialport = require('serialport');

exports.start = function(onData) {
  var serialPort = Q.nfbind(serialport.list)().then(function(ports) {
    // console.log(ports);
    var likelyPorts = ports.filter(function(port) {
      return port.serialNumber == 'AH02LT2Q';
    });
    return new (serialport.SerialPort)(likelyPorts[0].comName, {
      parser: serialport.parsers.readline("\n")
    });
  });


  return serialPort.then(function(port) {
    var deferred = Q.defer();
    port.on("open", function() {
      port.on("data", function(data) {
        data = data.trim();
        while (data[0] == '\u0002' || data[0] == '\u0003') {
          data = data.substr(1);
        }
        if (onData) {
          onData(data.trim());
        } else {
          console.log("Tag from:", data);          
        }
      });
      deferred.resolve();
    });
    port.on("error", function(err) {
      console.log("Error!", err);
      deferred.reject(err);
    });
    return deferred.promise;
  }, function(error) {
    console.warn("Failed to open serial port:", error);
    throw error;
  });
}
