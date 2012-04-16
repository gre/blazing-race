(function(ns){
  var makeEvent = BlazingRace.util.makeEvent
  ;

  // TODO : setResource , a { name: path, name: path } would be better
   ns.ImageManager =  function (images, totalBytes) {
    var self = this;
    var version = window.VERSION || 1;

    self.E = makeEvent({});

    var resources = {};

    var countLoaded = 0;
    var countTotal = 0; 
    var loadeds = [];
    for (var name in images) { 
      ++ countTotal;
      loadeds.push(0);
    }

    self.start = function () {
      var i = 0;
      for (var name in images) { (function(i, name){
        var src = images[name]+"?v="+version;
        var req = new XMLHttpRequest();  
        req.addEventListener("progress", function (e) {
          loadeds[i] = e.loaded;
          pubProgress();
        }, false);  
        req.addEventListener("load", function (e) {
          // loadeds[i] = e.loaded;
          var img = document.createElement("img");
          img.onload = function () {
            ++ countLoaded;
            pubProgress();
            if (self.isReady()) {
              self.E.pub("loaded");
              self.E.del("loaded");
            }
          }
          img.src = src;
          resources[name] = img;
        }, false);  
        req.addEventListener("error", function (e) {
          self.E.pub("error", { msg: "load error for "+src });
        }, false);  
        req.open("GET", src, true);  
        req.send();

        }(i++, name));
      }
    }

    self.isReady = function () {
      return countLoaded == countTotal;
    }

    self.ready = function (callback) {
      if (self.isReady())
        callback();
      else {
        self.E.sub("loaded", callback);
      }
    }

    function pubProgress () {
      var value=0; for(var i=0;i<loadeds.length;++i) value+=loadeds[i];
      self.E.pub("progress", { value: value, total: totalBytes });
    }

    self.getResource = function (name) {
      return resources[name];
    }
  }

}(window.BlazingRace));

