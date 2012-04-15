(function(ns){
  // TODO : setResource , a { name: path, name: path } would be better
   ns.ImageManager =  function (images) {
    var self = this;
    var count = 0;
    var onloaded = function () {};

    var resources = {};

    var version = window.VERSION || 1;

    var nb = 0;
    for (var name in images) { ++ nb }

    for (var name in images) {
      var img = new Image();
      img.onload = function () {
        ++ count;
        if (self.isReady())
          onloaded();
      }
      img.src = images[name]+"?v="+version;
      resources[name] = img;
    }

    self.isReady = function () {
      return count == nb;
    }

    self.ready = function (callback) {
      if (self.isReady())
        callback();
      else
        onloaded = callback;
    }

    self.progress = function () {
      return count / nb;
    }

    self.getResource = function (name) {
      return resources[name];
    }
  }

}(window.BlazingRace));

