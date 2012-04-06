(function(ns){
  // TODO
   ns.ImageManager =  function (images, dir, ext) {
    var self = this;
    var count = 0;
    var onloaded = function () {};
    dir = dir || "";
    ext = ext || "";

    var resources = {};

    for (var i = 0; i<images.length; ++i) {
      var name = images[i];
      var imgSrc = dir+name+ext;
      var img = new Image();
      img.onload = function () {
        if (++count == images.length)
          onloaded();
      }
      img.src = imgSrc;
      resources[name] = img;
    }

    self.ready = function (callback) {
      if (count==images.length)
        callback();
      else
        onloaded = callback;
    }

    self.getResource = function (name) {
      return resources[name];
    }
  }

}(window.BlazingRace));

