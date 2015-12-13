var u = require('./util');
var fs = require('fs');
var path = require('path');

var fileCache = {};

function errorHandler(err){
  console.log(err);
}

function requestHandler(req, res){
  if(fileCache[req.url]){
    res.end(fileCache[req.url]);
  } else {
    var fileChunkArray = [];
    var location = path.join(__dirname, '../', req.url);
    u.fileSizeAndSafety(location)
    .then(function(size){
      var fileStream = fs.createReadStream(location);
      fileStream.pipe(res);
      fileStream.on('data', function(data){
        fileChunkArray.push(data);
      })
      fileStream.on('end', function(){
        res.end();
        fileCache[req.url] = Buffer.concat(fileChunkArray, size);
      });
    })
    .catch(errorHandler)
  }
}

var router = {
  requestHandler: requestHandler
}

module.exports = router;
