var u = require('./util');
var fs = require('fs');
var path = require('path');
var depsCache = require('./route-deps/index.json');

var fileCache = {};


function errorHandler(err){
  console.log(err);
  if(err.stack){
    console.log(err.stack);
  }
}

function router(req, res){
  console.log(req.headers);
  var depIndex = req.url;
  if(!res.push) return res.end();
  if(req.url === '/'){

    var route = req.headers.referer || "https://" + req.headers.host + "/";
    route = route.replace('https://' + req.headers.host, "");
    var outgoing = [];
    if(depsCache[route] && depsCache[route].deps){
      depsCache[route].deps.forEach(function(dep){
        outgoing.push({route: dep.substring(1), content: fileCache[dep]});
      })
    }

    var count = 0;
    var total = outgoing.length;
    next();

    if(depsCache[depIndex].page){
      res.write(fileCache[depsCache[depIndex].page]);
    }

    function next(){
      var item = outgoing.shift();
      var push = res.push(item.route);
      push.setHeader("Content-Type", "text/javascript;charset=UTF-8")
      var ready = push.write(item.content, null, function(err){
        push.end();
      });
      push.on('finish', function(){
        count++;
        console.log(count);
        if(count == total){
          console.log('done');
          res.end();
        }
      })
      if(outgoing.length > 0){
        next();
      }
    }

  } else {
    res.end(fileCache[depsCache[depIndex].page]);
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
