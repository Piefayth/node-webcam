var u = require('./util');
var fs = require('fs');
var path = require('path');
var depsCache = require('./route-deps/index.json');
var ENABLE_SERVER_PUSH = true;
var fileCache = {};
var specialFileCache = {};

function errorHandler(err){
  console.log(err);
  if(err.stack){
    console.log(err.stack);
  }
}

function router(req, res){

  var depIndex = req.url;

  if(ENABLE_SERVER_PUSH){
    if(depsCache[depIndex]){
      res.write(fileCache[depsCache[depIndex].page]);
    }
  } else {
    res.end(fileCache[depsCache[depIndex].page]);
  }

  var route = req.headers.referer || "https://" + req.headers.host + "/";
  route = route.replace('https://' + req.headers.host, "");
  if(!res.push) return res.end();
  if(req.url === '/'){
    var outgoing = [];
    if(depsCache[route] && depsCache[route].deps){
      depsCache[route].deps.forEach(function(dep){
        outgoing.push({route: dep.substring(1), content: specialFileCache[dep]});
      })
    }

    var count = 0;
    var total = outgoing.length;


    if(ENABLE_SERVER_PUSH)
      next();

    function next(){
      var item = outgoing.shift();
      var push = res.push(item.route);
      push.setHeader("Content-Type", "text/javascript;charset=UTF-8")
      //push.setHeader("Content-Length", item.content.length);
      push.writeHead(200);
      chunk(push, item.content)
      .then(function(){
        count++;
        if(count == total){
          return res.end();
        }
        next();
      })
    }


    function chunk(push, arraybufs){

      var buf_count = 0;
      var init_len = arraybufs.length;

      return new Promise(function(resolve, reject){
        _chunk();
        function _chunk(){
          push.write(arraybufs.shift(), null, function(err){
            buf_count++;
            if(buf_count >= init_len){
              push.end();
              return resolve();
            }
            _chunk();
          })
        }
      })

    }

  } else {
    if(depsCache[depIndex]){
      res.end(fileCache[depsCache[depIndex].page]);
    } else {
      res.end(fileCache['.' + depIndex]);
    }
  }
}

function preloadDependencies(){
  return checkSafeAccessForDeps()
  .then(function(deps){
    return loadDepsToCache(deps)
  })
  .catch(errorHandler);
}

function loadDepsToCache(deps){
  var promises = [];
  deps.forEach(function(dep){
    promises.push(loadSizedFileToCache(dep.path, dep.size));
  })
  return Promise.all(promises);
}

function checkSafeAccessForDeps(){
  var promises = [];
  for(var route in depsCache){
    if(depsCache[route].deps){
      depsCache[route].deps.forEach(function(dep){
        promises.push(u.fileSizeAndSafety(dep));
      })
    }
    promises.push(u.fileSizeAndSafety(depsCache[route].page));
  }
  return Promise.all(promises);
}

function loadSizedFileToCache(location, size){
  if(!location.match(/.*[\\\/]+[^\\\/]+$/)) return Promise.resolve();
  function promiseFunction(resolve, reject){
    var fileChunkArray = [];
    var fileStream = fs.createReadStream(location);
    fileStream.on('data', function(data){
      fileChunkArray.push(data);
    })
    fileStream.on('end', function(){
      specialFileCache[location] = fileChunkArray;
      fileCache[location] = Buffer.concat(fileChunkArray, size);
      resolve();
    });
    fileStream.on('error', function(err){
      reject(err);
    })
  }
  return new Promise(promiseFunction);
}

var router = {
  router: router,
  preloadDependencies: preloadDependencies
}

module.exports = router;
