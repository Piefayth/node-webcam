function streamBlobToServer(stream){
  var BLOB_POLLING_RATE = 1000; //ms
  var options = {};

  var mr = safeMediaRecorder(stream, options);

  var arrayBuffers = [];

  mr.ondataavailable = function(event){
    var fr = new FileReader();
    if(event.data != null){
      fr.readAsArrayBuffer(event.data);
    }

    fr.addEventListener("loadend", function(){
      arrayBuffers.push(fr.result);
    })
    console.log(arrayBuffers);
  }
  mr.start();

  var interval = window.setInterval(function(){
    mr.requestData();
  }, BLOB_POLLING_RATE)
}


// Passing a blank "options" object to Chrome causes it to break terribly.
function safeMediaRecorder(stream, options){
  try {
    var mr = new MediaRecorder(stream, options);
  } catch (e){
    var mr = new MediaRecorder(stream);
  }
  return mr;
}
