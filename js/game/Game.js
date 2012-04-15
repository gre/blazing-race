(function(ns){

  var makeEvent = BlazingRace.util.makeEvent
  , smoothstep = BlazingRace.util.smoothstep
  ;

  var b2Vec2 = Box2D.Common.Math.b2Vec2
  ;

  ns.Game = function (world, camera) {
    var self = this;
    
    self.E = makeEvent({});
      
    self.world = world;
    self.camera = camera;

    self.startTime = 0;


    function stop() {

    }

    function start() {
      self.startTime = +new Date();
    }

    function won () {
      return self.player.candleCount >= world.map.candles.length;
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
    
    // FIXME TODO new Candle () 
    var candleOn, candleOff;

    function drawCandleIndicator (ctx, camera, candle) {
      var playerPosition = self.player.getPosition();
      var v = candle.GetPosition().Copy();
      v.Subtract(playerPosition);
      var dist = v.Normalize();
      var mindist = new b2Vec2(self.world.width, self.world.height).Normalize();
      var size = 40*(1-1.2*smoothstep(0, mindist, dist));

      if (size > 0) {
        var p = camera.projectOnBounds(playerPosition, v, size+5);

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

    function drawCandle (ctx, candle, camera, i) {
      var CANDLE_W = 1 * camera.scale;
      var CANDLE_H = Math.floor(CANDLE_W * candleOn.height/candleOn.width);
      var position = candle.GetPosition();
      var fixture = candle.GetFixtureList();
      var lighted = fixture.GetBody().GetUserData().lighted;

      var p = camera.realPositionToCanvas(position);
      var w = ctx.canvas.width;
      var h = ctx.canvas.height;

      var visible = (function (x, y) {
        return -CANDLE_W/2 < x && x < w+CANDLE_W/2 && -CANDLE_H/2 < y && y < h+CANDLE_H/2;
      }(p.x, p.y));

      if (!visible && !lighted) {
        drawCandleIndicator(ctx, camera, candle);
      }

      if (visible) {
        ctx.save();
        ctx.translate(p.x, p.y);
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
    
    self.setup = function (loader) {
      candleOn = loader.getResource("candleOn");
      candleOff = loader.getResource("candleOff");
      self.world.setup(loader);
      self.player.setup(loader);
    }

    self.render = function (ctx, camera) {
      self.world.renderBackground(ctx, camera);
      self.player.renderBall(ctx, camera);
      self.player.renderFlame(ctx, camera);
      self.world.renderMap(ctx, camera);
      for (var i = 0; i < self.world.candles.length; ++i) {
        drawCandle(ctx, self.world.candles[i], camera, i);
      }
      self.player.renderControls(ctx, camera);
    }
  }

}(window.BlazingRace));
