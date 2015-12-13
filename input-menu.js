$(document).ready(function(){
  init();
})

function init(){
  var constraints = { audio: true, video: true };
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices){
    devices.forEach(function(deviceInfo){
      var context = { deviceId: deviceInfo.deviceId,
                      label: deviceInfo.label };
                      console.log($('#input-option-template').html());
      var html = Handlebars.template();

      console.log(html);
      if(deviceInfo.kind === "audioinput"){
        $('#audio-select').append(html);
      } else {
        $('#video-select').append(html);
      }
    })
    var video = document.querySelector('video');
    //video.src = window.URL.createObjectURL(stream);
  })

}
