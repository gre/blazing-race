(function(ns){

  var makeEvent = BlazingRace.util.makeEvent;

  var b2Vec2 = Box2D.Common.Math.b2Vec2;

  ns.Camera = function (world, width, height) {
    var self = this;
    // non normalized position
    self.x = 0;
    self.y = 0;
    self.width = width;
    self.height = height;

    self.E = makeEvent({});

    self.getPosition = function () {
      return new b2Vec2(self.x, self.y);
    }

    self.canvasToRealPosition = function (p) {
      return new b2Vec2(
        (-self.x + p.x)/DRAW_SCALE,
        (-self.y + p.y)/DRAW_SCALE
      )
    }

    // Return the projected point of the point o with the vector v
    // to the camera bound with a given padding.
    self.projectOnBounds = function (o, v, padding) {
      var W = self.width, H = self.height;
      o = o.Copy();
      o.Multiply(DRAW_SCALE);
      o.Add(self.getPosition());
      if (!padding) padding = 0;
      var x, y, k;

      // Try to project on left and right sides
      for (var i=0; i<=1; ++i) {
        var x = W*i;
        k = (x-o.x)/v.x;
        y = o.y + k*v.y;
        if ( k > 0 && 0 <= y && y <= H ) {
          return new b2Vec2(
            x + (!y ? padding : -padding), 
            y + (!y ? padding : -padding)
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
            x + (!x ? padding : -padding), 
            y + (!y ? padding : -padding)
          );
        }
      }
    }

    self.start = function () {
    }

    self.focusOn = function (position) {
      var x, y;
      var v = position;
      if (world.width > self.width) {
        if (v.x*DRAW_SCALE < (world.width - self.width/2) && v.x*DRAW_SCALE > self.width/2) {
          x = -(v.x*DRAW_SCALE)+(self.width/2);
        }
        else if(v.x*DRAW_SCALE >= (world.width-self.width/2)) {
          x = self.width-world.width;
        }
        else {
          x = 0;
        }
        self.x = x;
      }
      if(world.height > self.height) {
				if(v.y*DRAW_SCALE < (world.height - self.height/2) && v.y*DRAW_SCALE > self.height/2) {
					y = -(v.y*DRAW_SCALE)+(self.height/2);
				}
				else if(v.y*DRAW_SCALE >= (world.height - self.height/2)) {
					y = (self.height - world.height);
				}
				else {
					y = 0;
				}
        self.y = y;
			}
    }
  }


}(window.BlazingRace));
