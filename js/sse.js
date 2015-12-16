window.addEventListener("load", function(){
  var source;
  connect();

  function connect(){
    source = new EventSource("data");
    source.onmessage = function(e){
      console.log('hey');
    }
    source.addEventListener("DISPLAY_THIS_IMAGE", function(event){
      var out = document.getElementById('output');
      out.innerHTML += '<img src=' + event.data + ' /><br>';
    }, false);

    source.addEventListener("open", function(event){
      console.log('connection open');
    }, false);
  }

})