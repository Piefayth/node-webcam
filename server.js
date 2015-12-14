var fs = require('fs');
var http2 = require('http2');
var core = require('./core');

var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

var server = http2.createServer(options);
server.listen(8080);
core.router.preloadDependencies()
.then(function(){
  server.on('request', core.router.router);
})
