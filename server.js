var fs = require('fs');
var spdy = require('spdy');
var core = require('./core');

var options = {
  cert: fs.readFileSync('keys/server.crt'),
  key: fs.readFileSync('keys/server.key'),
  ca: fs.readFileSync('keys/server.csr')
};

var server = spdy.createServer(options);
server.listen(8080);
core.router.preloadDependencies()
.then(function(){
  server.on('request', core.router.router);
})
