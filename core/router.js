var u = require('./util');
var fs = require('fs');
var path = require('path');
var depsCache = require('./route-deps/index.json');
var ENABLE_SERVER_PUSH = true;
var fileCache = {};


function errorHandler(err){
  console.log(err);
  if(err.stack){
    console.log(err.stack);
  }
}

function router(req, res){

  var depIndex = req.url;

  if(ENABLE_SERVER_PUSH){
    if(depsCache[depIndex].page){
      res.write(fileCache[depsCache[depIndex].page]);
    } else {
      console.log(depIndex);
      console.log(depsCache);
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
        outgoing.push({route: dep.substring(1), content: fileCache[dep]});
      })
    }

    var count = 0;
    var total = outgoing.length;


    if(ENABLE_SERVER_PUSH) next();

    function next(){
      var item = outgoing.shift();
      var push = res.push(item.route);
      push.setHeader("Content-Type", "text/javascript;charset=UTF-8")
      push.setHeader("Content-Length", item.content.length);
      console.log(item.route);
      var ready = push.write(item.content, null, function(err){
        console.log(push.write.toString());
        console.log('sent');
        console.log(item.route);
        count++;
        console.log(count);
        push.end();
        if(count == total){
          res.end();
        }
      })
      push.on('error', errorHandler);
      if(outgoing.length > 0){
        next();
      }
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
