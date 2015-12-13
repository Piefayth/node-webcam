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
  var audio = $('#audio-input-source').val();
  return audio ? audio : "";
}

function getVideoSourceId(){
  var video = $('#video-input-source').val();
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
    var streamUrl = window.URL.createObjectURL(stream);
    video.src = streamUrl;
    streamBlobToServer(stream);
    return initializeSourceSelectionTemplate();
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

function initializeSourceSelectionTemplate(){
  if(navigator.vendor == "Google Inc."){
    getAudioAndVideoSources()
    .then(function(sources){
      return createInputSourceDropdowns(sources);
    })
  }
}

function createInputSourceDropdowns(sources){
  if($('#audio-input-source').length > 0) return Promise.resolve();

  var html = Handlebars.templates['input-source-dropdown.js'];
  $('#input-options-panel').append(html);

  return updateInputSourceDropdowns(sources);
}

function updateInputSourceDropdowns(sources){
  var inputSourceHandler = function(type){
    return function(source){
      var context = {
        deviceId: source.deviceId,
        label: source.label
      }
      var html = Handlebars.templates['input-option.js'](context);
      $('#' + type + '-input-source').append(html);
    }
  }

  sources.audio.forEach(inputSourceHandler('audio'));
  sources.video.forEach(inputSourceHandler('video'));

  return Promise.resolve();
}

function getAudioAndVideoSources(){
  var input_devices = { audio: [], video: [] };

  return navigator.mediaDevices.enumerateDevices()
  .then(function(devices){
    devices.forEach(function(device){
      if(device.kind === "audioinput"){
        input_devices.audio.push(device)
      } else if(device.kind === "videoinput"){
        input_devices.video.push(device);
      }
    })
    return Promise.resolve(input_devices);
  })
}
