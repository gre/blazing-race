(function(ns){

  var makeEvent = BlazingRace.util.makeEvent
  , clamp = BlazingRace.util.clamp
  ;

  var b2Vec2 = Box2D.Common.Math.b2Vec2;

  ns.Camera = function (autoscale) {
    var self = this;
    // non normalized position
    self.x = 0;
    self.y = 0;
    self.width = 300;
    self.height = 200;
    self.scale = 30;

    self.E = makeEvent({});

    self.resize = function (w, h) {
      self.width = w;
      self.height = h;
      autoscale && self.setScale(clamp(10, 40, Math.round((w+h)/60)));
    }

    self.setWorldSize = function (w, h) {
      self.worldwidth = w;
      self.worldheight = h;
    }

    self.setScale = function (s) {
      self.scale = s;
      self.E.pub("scale", s);
    }

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
        Math.round(self.x + self.scale*p.x),
        Math.round(-self.y -self.scale*(p.y)+self.height)
      )
    }

    self.translateContext = function (ctx) {
      ctx.translate(self.x, Math.round(-self.y-self.scale*self.worldheight+self.height));
    }

    self.translateContextWithParallax = function (ctx, x, y) {
      ctx.translate(
        Math.round(self.x*x), 
        Math.round(-self.y*y-self.scale*self.worldheight+self.height)
      );
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
      if (self.scale*self.worldwidth > self.width) {
        if (v.x*self.scale < (self.scale*self.worldwidth - self.width/2) && v.x*self.scale > self.width/2) {
          x = -(v.x*self.scale)+(self.width/2);
        }
        else if(v.x*self.scale >= (self.scale*self.worldwidth-self.width/2)) {
          x = self.width-self.scale*self.worldwidth;
        }
        else {
          x = 0;
        }
        self.x = Math.round(x);
      }
      if(self.scale*self.worldheight > self.height) {
        if(v.y*self.scale < (self.scale*self.worldheight - self.height/2) && v.y*self.scale > self.height/2) {
          y = -(v.y*self.scale)+(self.height/2);
        }
        else if(v.y*self.scale >= (self.scale*self.worldheight - self.height/2)) {
          y = (self.height - self.scale*self.worldheight);
        }
        else {
          y = 0;
        }
        self.y = Math.round(y);
      }
    }
  }


}(window.BlazingRace));
