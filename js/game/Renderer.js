(function(ns){

  ns.Renderer = function (canvas) {
    var self = this;

    var ctx = canvas.getContext("2d");

    self.resize = function (w, h) {
      canvas.width = w;
      canvas.height = h;
    }

    function setup (camera, loader)  {
      for (var i = 0; i < self.layers.length; ++ i) {
        var layer = self.layers[i];
        layer.setup && layer.setup(loader, camera);
      }
    }

    self.setLayers = function (layers) {
      self.layers = layers;
    }

    function render (camera) {
      ctx.save();
      for (var i = 0; i < self.layers.length; ++ i)
        self.layers[i].render(ctx, camera);
      ctx.restore();
    }

    this.start = function (camera, loader) {
      setup(camera, loader);
      requestAnimFrame(function loop () {
        requestAnimFrame(loop, canvas);
        render(camera);
      }, canvas);
    }
  }

}(window.BlazingRace));
