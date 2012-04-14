(function(ns){

  var makeEvent = BlazingRace.util.makeEvent
  , clamp = BlazingRace.util.clamp
  ;

  var b2Vec2 = Box2D.Common.Math.b2Vec2;

  ns.Camera = function (world, _width, _height, _scale) {
    var self = this;
    // non normalized position
    self.x = 0;
    self.y = 0;
    self.width = _width;
    self.height = _height;
    self.scale = _scale || 30;

    self.resize = function (w, h) {
      self.width = w;
      self.height = h;
    }

    self.E = makeEvent({});

    self.getPosition = function () {
      return new b2Vec2(self.x, self.y);
    }

    self.canvasToRealPosition = function (p) {
      return new b2Vec2(
        (-self.x + p.x)/self.scale,
        (-self.y + self.height - p.y)/self.scale
      )
    }

    self.realPositionToCanvas = function (p) {
      return new b2Vec2(
        self.x + self.scale*p.x,
        -self.y -self.scale*(p.y)+self.height
      )
    }

    self.translateContext = function (ctx) {
      ctx.translate(self.x, -self.y-self.scale*world.height+self.height);
    }

    // Return the projected point of the point o with the vector v
    // to the camera bound with a given padding.
    self.projectOnBounds = function (o, v, padding) {
      var W = self.width, H = self.height;
      o = self.realPositionToCanvas(o);
      v.Normalize();
      v.y *= -1;
      if (!padding) padding = 0;
      var x, y, k;

      // Try to project on left and right sides
      for (var i=0; i<=1; ++i) {
        var x = W*i;
        k = (x-o.x)/v.x;
        y = o.y + k*v.y;
        if ( k > 0 && 0 <= y && y <= H ) {
          return new b2Vec2(
            clamp(padding, W-padding, x),
            clamp(padding, H-padding, y)
          );
        }
      }

      // Try to project on top and bottom sides
      for (var i=0; i<=1; ++i) {
        var y = H*i;
        k = (y-o.y)/v.y;
        x = o.x + k*v.x;
        if ( k > 0 && 0 <= x && x <= W ) {
          return new b2Vec2(
            clamp(padding, W-padding, x),
            clamp(padding, H-padding, y)
          );
        }
      }
    }

    // Move the camera centered to the position v
    self.focusOn = function (v) {
      var x, y;
      if (self.scale*world.width > self.width) {
        if (v.x*self.scale < (self.scale*world.width - self.width/2) && v.x*self.scale > self.width/2) {
          x = -(v.x*self.scale)+(self.width/2);
        }
        else if(v.x*self.scale >= (self.scale*world.width-self.width/2)) {
          x = self.width-self.scale*world.width;
        }
        else {
          x = 0;
        }
        self.x = Math.round(x);
      }
      if(self.scale*world.height > self.height) {
        if(v.y*self.scale < (self.scale*world.height - self.height/2) && v.y*self.scale > self.height/2) {
          y = -(v.y*self.scale)+(self.height/2);
        }
        else if(v.y*self.scale >= (self.scale*world.height - self.height/2)) {
          y = (self.height - self.scale*world.height);
        }
        else {
          y = 0;
        }
        self.y = Math.round(y);
      }
    }
  }


}(window.BlazingRace));
