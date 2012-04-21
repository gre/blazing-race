(function(ns){

  ns.Renderer = function (canvas) {
    var self = this;

    self.layers = [];

    var ctx = canvas.getContext("2d");
    var camera, loader;

    // Change the canvas size
    self.resize = function (w, h) {
      canvas.width = w;
      canvas.height = h;
    }

    // Change every layers
    self.setLayers = function (layers) {
      self.layers = layers;
      setupLayers();
    }

    // Remove a layer
    self.removeLayer = function (layer) {
      var i = self.layers.indexOf(layer);
      if (i != -1) self.layers.splice(i, 1);
      setupLayers();
    }

    // Add a layer with an optional zindex
    self.addLayer = function (layer, zindex) {
      if (arguments.length>1) layer.zindex = zindex;
      self.layers.push(layer);
      setupLayers();
    }

    function setupLayers () {
      // Recompute z indexes
      self.layers.sort(function (a, b) {
        return (a.zindex||0) - (b.zindex||0);
      });

      // Setup if ready and for those which aren't set up
      if (loader) {
        for (var i = 0; i < self.layers.length; ++ i) {
          var layer = self.layers[i];
          if (layer.setup) {
            layer.setup(loader, camera);
            layer.setup = null;
          }
        }
      }
    }

    function render (camera) {
      for (var i = 0; i < self.layers.length; ++ i)
        self.layers[i].render(ctx, camera);
    }

    this.start = function (cam, loa) {
      camera = cam;
      loader = loa;
      setupLayers();
      // Render loop
      requestAnimFrame(function loop () {
        requestAnimFrame(loop, canvas);
        render(camera);
      }, canvas);
    }
  }

}(window.BlazingRace));
