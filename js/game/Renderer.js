(function(ns){

  ns.Renderer = function (canvas) {
    var self = this;

    self.layers = [];

    var ctx = canvas.getContext("2d");
    var camera, loader;

    self.resize = function (w, h) {
      canvas.width = w;
      canvas.height = h;
    }

    function setup (camera, loader)  {
      for (var i = 0; i < self.layers.length; ++ i) {
        var layer = self.layers[i];
        if (layer.setup) {
            layer.setup(loader, camera);
            layer._setup = layer.setup;
            layer.setup = null;
        }
      }
    }

    self.setLayers = function (layers) {
      self.layers = layers;
      loader && setup (camera, loader);
    }

    function render (camera) {
      ctx.save();
      for (var i = 0; i < self.layers.length; ++ i)
        self.layers[i].render(ctx, camera);
      ctx.restore();
    }

    this.start = function (cam, loa) {
      camera = cam;
      loader = loa;
      setup(camera, loader);
      requestAnimFrame(function loop () {
        requestAnimFrame(loop, canvas);
        render(camera);
      }, canvas);
    }
  }

}(window.BlazingRace));
