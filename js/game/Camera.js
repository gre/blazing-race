(function(ns){

  var makeEvent = BlazingRace.util.makeEvent
  , clamp = BlazingRace.util.clamp
  ;

  var b2Vec2 = Box2D.Common.Math.b2Vec2;

  ns.Camera = function (world, width, height) {
    var self = this;
    // non normalized position
    self.x = 0;
    self.y = 0;
    self.width = width;
    self.height = height;

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
        (-self.x + p.x)/DRAW_SCALE,
        (-self.y + self.height - p.y)/DRAW_SCALE
      )
    }

    self.realPositionToCanvas = function (p) {
      return new b2Vec2(
        self.x + DRAW_SCALE*p.x,
        -self.y -DRAW_SCALE*(p.y)+self.height
      )
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
      if (DRAW_SCALE*world.width > self.width) {
        if (v.x*DRAW_SCALE < (DRAW_SCALE*world.width - self.width/2) && v.x*DRAW_SCALE > self.width/2) {
          x = -(v.x*DRAW_SCALE)+(self.width/2);
        }
        else if(v.x*DRAW_SCALE >= (DRAW_SCALE*world.width-self.width/2)) {
          x = self.width-DRAW_SCALE*world.width;
        }
        else {
          x = 0;
        }
        self.x = x;
      }
      if(DRAW_SCALE*world.height > self.height) {
        if(v.y*DRAW_SCALE < (DRAW_SCALE*world.height - self.height/2) && v.y*DRAW_SCALE > self.height/2) {
          y = -(v.y*DRAW_SCALE)+(self.height/2);
        }
        else if(v.y*DRAW_SCALE >= (DRAW_SCALE*world.height - self.height/2)) {
          y = (self.height - DRAW_SCALE*world.height);
        }
        else {
          y = 0;
        }
        self.y = y;
      }
    }
  }


}(window.BlazingRace));
