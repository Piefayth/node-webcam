var fs = require('fs');
var path = require('path');

var promiseMe = function(asyncTask /**/){
  var boundTask = asyncTask.bind.apply(asyncTask, arguments)
  var taskResult = new Promise(function(resolve, reject){
    boundTask(function(err /**/){
      var a = [];
      for(var k in arguments){ if(k != 0) a.push(arguments[k]) }
      var res = a.length > 1 ? a : a[0];
      err ? reject(err) : resolve(res);
    })
  })
  return taskResult;
}

var fileSizeAndSafety = function(route){
  return promiseMe(fs.stat, route)
  .then(function(result){
    return Promise.resolve({
      size: result.size,
      path: route
    })
  })
}

var util = {
  fileSizeAndSafety: fileSizeAndSafety,
  promiseMe: promiseMe
}

module.exports = util;
