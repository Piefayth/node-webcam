$(document).ready(function(){
  init();
})

function init(){
  initializeStream()
  .then(function(){
    return configureInputClickHandlers();
  })
}

function getAudioSourceId(){
  var audio = $('#audio-select').val();
  return audio ? audio : "";
}

function getVideoSourceId(){
  var video = $('#video-select').val();
  return video ? video : "";
}

function initializeStream(){
  var constraints = {
    audio: {
      optional: [{sourceId: getAudioSourceId()}]
    },
    video: {
      optional: [{sourceId: getVideoSourceId()}]
    }
  };
  return universalGetUserMedia(constraints)
  .then(function(stream){
    var video = document.querySelector('video');
    video.src = window.URL.createObjectURL(stream);
    var audio = document.querySelector('audio');
    audio.src = window.URL.createObjectURL(stream);
    return Promise.resolve();
  })
}

function universalGetUserMedia(constraints){
  if(navigator.mediaDevices.getUserMedia){
    return navigator.mediaDevices.getUserMedia(constraints);
  } else {
    navigator.getUserMedia = navigator.getUserMedia         ||
                             navigator.webkitGetUserMedia   ||
                             navigator.mozGetUserMedia;

    var mediaPromiseFunction = function(resolve, reject){
     navigator.getUserMedia(constraints, resolve, reject)
    }
    return new Promise(mediaPromiseFunction);
  }
}

function configureInputClickHandlers(){
  $('#change-device-button').click(initializeStream);
}
