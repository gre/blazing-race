(function(ns){

  var makeEvent = BlazingRace.util.makeEvent
  , smoothstep = BlazingRace.util.smoothstep
  ;

  var b2Vec2 = Box2D.Common.Math.b2Vec2
  , b2ContactListener = Box2D.Dynamics.b2ContactListener
  ;

  ns.Game = function (world, camera) {
    var self = this;
    
    self.E = makeEvent({});
      
    self.world = world;
    self.camera = camera;

    self.startTime = 0;
    self.candleCount = 0;


    function stop() {

    }

    function start() {
      self.startTime = +new Date();
      var contactListener = new b2ContactListener;
      // FIXME: move to player ?
      contactListener.BeginContact = function (contact) {
        var aData = contact.GetFixtureA().GetBody().GetUserData();
        var bData = contact.GetFixtureB().GetBody().GetUserData();

        // TODO
        /*
        if (bData && bData.type=="player") {
          self.player.onContact(contact);
        }
        */
        if (aData && bData) {
          if (aData.type=="water" && bData.type=="player" && self.player.oxygen>0) {
            self.player.die();
            self.E.pub("collideWater");
          }
          else if (aData.type=="candle" && bData.type=="player") {
            if (self.player.oxygen && !aData.lighted) {
              aData.lighted = true;
              var candle = contact.GetFixtureA().GetBody();
              candle.SetUserData(aData);
              ++ self.candleCount;
              self.E.pub("lightCandle", { body: candle });
            }
          }
        }
      }
      self.world.world.SetContactListener(contactListener);
    }

    function won () {
      return self.candleCount >= world.map.candlesToWin;
    }

    self.checkGameState = function () {
      if (won())
        return 1;
      if (self.player.isDead())
        return -1;
      return 0;
    }

    self.start = function () {
      start();
      self.E.pub("started");
    }
    self.stop = function () {
      stop();
      self.E.pub("stopped");
    }

    /// RENDERING
    var candleOn, candleOff, CANDLE_W = 30, CANDLE_H = 30;

    function drawCandleIndicator (ctx, candle) {
      var playerPosition = self.player.getPosition();
      var v = candle.GetPosition().Copy();
      v.Subtract(playerPosition);
      var dist = v.Normalize();
      var mindist = new b2Vec2(self.world.width, self.world.height).Normalize()/DRAW_SCALE;
      var size = 40*(1-1.2*smoothstep(0, mindist, dist));

      if (size > 0) {
        var p = self.camera.projectOnBounds(playerPosition, v, size+5);
        p.Subtract(self.camera.getPosition());

        ctx.save();
        ctx.translate(p.x, p.y);

        ctx.rotate(Math.atan2(v.y, v.x));

        ctx.fillStyle = 'rgba(240, 210, 100, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, -size/4);
        ctx.lineTo(0, size/4);
        ctx.lineTo(size, 0);
        ctx.fill();

        ctx.restore();
      }
    }

    function drawCandle (ctx, candle) {
      var position = candle.GetPosition();
      var fixture = candle.GetFixtureList();
      var lighted = fixture.GetBody().GetUserData().lighted;
      var x = position.x * DRAW_SCALE;
      var y = position.y * DRAW_SCALE;
      var w = ctx.canvas.width;
      var h = ctx.canvas.height;

      var ax = x + self.camera.x;
      var ay = y + self.camera.y;

      var visible = (function (x, y) {
        return -CANDLE_W/2 < x && x < w+CANDLE_W/2 && -CANDLE_H/2 < y && y < h+CANDLE_H/2;
      }(ax, ay));

      if (!visible && !lighted) {
        drawCandleIndicator(ctx, candle);
      }

      if (visible) {
        ctx.save();
        ctx.translate(x, y);
        if (lighted) {
          ctx.fillStyle = 'rgb(255, 200, 150)';
          ctx.drawImage(candleOn, -CANDLE_W/2, -CANDLE_W/2-(CANDLE_H-CANDLE_W), CANDLE_W, CANDLE_H);
        }
        else {
          ctx.fillStyle = 'rgb(200, 170, 160)';
          ctx.drawImage(candleOff, -CANDLE_W/2, -CANDLE_W/2-(CANDLE_H-CANDLE_W), CANDLE_W, CANDLE_H);
        }
        ctx.restore();
      }
    }
    
    function drawBackground (ctx) {
      ctx.fillStyle = 'rgb(100, 70, 50)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }


    self.setup = function (loader) {
      candleOn = loader.getResource("candle-on");
      candleOff = loader.getResource("candle-off");
      CANDLE_H = Math.floor(CANDLE_W * candleOn.height/candleOn.width);
      self.world.setup(loader);
      self.player.setup(loader);
    }

    self.render = function (ctx) {
      ctx.save();
      drawBackground(ctx);
      ctx.translate(self.camera.x, self.camera.y);
      self.world.render(ctx);
      for (var i = 0; i < self.world.candles.length; ++i) {
        drawCandle(ctx, self.world.candles[i]);
      }
      self.player.render(ctx);
    }
  }

}(window.BlazingRace));
