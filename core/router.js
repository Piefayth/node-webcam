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
  if(req.url === '/data'){
    dataStream(req, res);
  } else {
    genericPage(req, res);
  }

}

function dataStream(req, res){
  res.writeHead(200, {"Content-Type": "text/event-stream",
                      "Connection": "keep-alive"});

  res.write("event: connecttime\n");
  res.write("data: " + (new Date()) + "\n\n");



  setInterval(function(){
    res.write("event: DISPLAY_THIS_IMAGE\n");
    res.write("data: ./img/image1.png\n\n");
  }, 1000);

}

function genericPage(req, res){
  var depIndex = req.url;
  if(req.method == 'POST'){
    return res.end('no');
  }
  if(!ENABLE_SERVER_PUSH){
    res.end(fileCache[depsCache[depIndex].page]);
  } else if(depsCache[depIndex]) {
    res.write(fileCache[depsCache[depIndex].page]);
  }
  var route = req.headers.referer || "https://" + req.headers.host + "/";
  route = route.replace('https://' + req.headers.host, "");
  if(!res.push) return res.end();

  servePageAndDeps(req, res, route);
}

function servePageAndDeps(req, res, route){
  var outgoing = [];
  var count = 0;

  if(depsCache[route] && depsCache[route].deps){
    depsCache[route].deps
    .forEach(function(dep){
      outgoing.push({route:   dep.substring(1),
                    content:  fileCache[dep]});
    })

    outgoing.forEach(pushHandler);

    function pushHandler(item){
      var options = {
        request: {
          accept: '*/*'
        },
        response: {
          'content-type': 'application/javascript'
        }
      }

      var push = res.push(item.route, options,
                          writeHandler.bind(push, item));
      push.on('error', errorHandler);
    }

    function writeHandler(item, err, push){
      push.end(item.content);
      count++;
      if(count >= outgoing.length){
        return res.end();
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
