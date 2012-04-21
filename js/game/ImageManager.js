(function(ns){
  var makeEvent = BlazingRace.util.makeEvent
  ;

   ns.ImageManager =  function (images, totalBytes) {
    var self = this;
    var version = window.VERSION || 1;

    self.E = makeEvent({});

    var resources = {};
    var resourcesWithScales = {};

    var countLoaded = 0;
    var countTotal = 0; 
    var loadeds = [];
    for (var name in images) { 
      ++ countTotal;
      loadeds.push(0);
    }

    self.load = function (callback) {
      self.E.sub("loaded", callback);
      var i = 0;
      for (var name in images) { (function(i, name){
        var src = images[name].src+"?v="+version;
        
        var req = new XMLHttpRequest();  
        req.addEventListener("progress", function (e) {
          loadeds[i] = e.loaded;
          pubProgress();
        }, false);  
        req.addEventListener("load", function (e) {
          var img = document.createElement("img");
          img.addEventListener("load", function () {
            ++ countLoaded;
            pubProgress();
            if (self.isReady()) {
              self.E.pub("loaded");
              self.E.del("loaded");
            }
          });
          img.addEventListener("error", function (e) {
            self.E.pub("error", { msg: "load failed for "+images[name].src+" (size limit?)" });
          });
          img.src = src;
          resources[name] = img;
        }, false);  
        req.addEventListener("error", function (e) {
          self.E.pub("error", { msg: "error for "+images[name].src  });
        }, false);  
        req.open("GET", src, true);  
        req.send();

        }(i++, name));
      }
    }

    self.isReady = function () {
      return countLoaded == countTotal;
    }

    function pubProgress () {
      var value=0; for(var i=0;i<loadeds.length;++i) value+=loadeds[i];
      self.E.pub("progress", { value: value, total: totalBytes });
    }

    function resourceForScaleId (name, w, h) { return name+"@"+w+"x"+h }

    function generateResourceForScale (name, w, h) {
      var id = resourceForScaleId(name, w, h);
      var img = resources[name];
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      if (images[name].mode=="repeat") {
        // repeat
        for (x=0; x<canvas.width; x += img.width) {
          for (y=0; y<canvas.height; y += img.height) {
            ctx.drawImage(img, x, y);
          }
        }
      }
      else {
        // scale
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
      }
      return resourcesWithScales[id] = canvas;
    }

    self.getResource = function (name, w, h) {
      if (!w||!h) return resources[name];
      w = Math.floor(w);
      h = Math.floor(h);
      var id = resourceForScaleId(name, w, h);
      return resourcesWithScales[id] || generateResourceForScale(name, w, h);
    }
  }

}(window.BlazingRace));

