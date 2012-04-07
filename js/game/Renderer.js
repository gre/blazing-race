(function(ns){
  ns.DEBUG = false;
  //ns.DEBUG = true;

  var	b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

  ns.Renderer = function (game, W, H, node, loader) {
    var self = this;

    var canvas = node.find("canvas.game")[0];
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext("2d");

    self.resize = function (w, h) {
      canvas.width = w;
      canvas.height = h;
    }

    var _initDebug = false;
    function initDebug () {
      _initDebug = true;
      var debugDraw = new Box2D.Dynamics.b2DebugDraw();
      debugDraw.SetSprite(ctx);
      debugDraw.SetDrawScale(DRAW_SCALE);
      debugDraw.SetFillAlpha(0.5);
      debugDraw.SetLineThickness(1.0);
      debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
      game.world.world.SetDebugDraw(debugDraw);
    }

    function setup ()  {
      if (ns.DEBUG) initDebug();
      game.setup(loader);
    }

    function render () {
      var camera = game.camera;
      ctx.save();
      if (ns.DEBUG) {
        if (!_initDebug) initDebug();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.translate(game.camera.x, game.camera.y);
        game.world.world.DrawDebugData();
      }
      else {
        game.render(ctx, camera);
      }
      ctx.restore();
    }

    // TODO clean this shit!
    // FIXME it should not contains any game logic... only event based

    var lastSeconds, lastMinutes;
    var $seconds = node.find(".chrono .seconds");
    var $minutes = node.find(".chrono .minutes");
    var countdownTime = +new Date();
    var countdownRunning = false;
    var ended = false;
    var COUNTDOWN_DURATION = 3000;
    function DOM_render () {
      if (ended) return;
      var duration = +new Date() - countdownTime - COUNTDOWN_DURATION;
      if (duration < 0) {
        if (!countdownRunning) {
          countdownRunning = true;
        }
        countdown( -duration );
      }
      else {
        if (countdownRunning) {
          if (game.checkGameState() == -1) {
            game.player.reignition();
          }
          else {
            game.start();
          }
          countdown(-1);  
          countdownRunning = false;
        }
        duration = +new Date() - game.startTime;
        var seconds = Math.floor(duration / 1000) % 60;
        var minutes = Math.floor(duration / 60000) % 60;
        if (seconds != lastSeconds) {
          $seconds.text(seconds<=9 ? "0"+seconds : seconds);
          lastSeconds = seconds;
        }
        if (minutes != lastMinutes) {
          $minutes.text(minutes);
          lastMinutes = minutes;
        }

        var state = game.checkGameState();
        if (state) {
          if (state>0) {
            ended = true;
            win();
          }
          else {
            lose();
          }
        }
      }
    }

    var $end = node.find(".front");

    var currentCount = null;
    function countdown(ms) {
      var seconds = Math.ceil(ms/1000);
      if (seconds === currentCount) {
        return;
      }
      currentCount = seconds;
      if (seconds>0) {
        $end.fadeIn();
        $end.find(".countdown").remove();
        $end.append('<div class="countdown">'+seconds+'</div>');
        setTimeout(function(){
          $end.find(".countdown").addClass("change");
        }, 100);
      }
      else if (seconds<=0) {
        $end.find(".message").empty();
        $end.find(".countdown").empty();
        $end.hide();
      }
    }

    function win() {
      $end.fadeIn().find(".message").text("All candles are lighted! You succeed!");
      game.stop();
    }

    function lose() {
      //game.stop();
      setTimeout(function(){
        $end.fadeIn().find(".message").text("Reignition...");
        countdownTime = +new Date();
      }, 500);
    }

    this.start = function () {

      setup();
      requestAnimFrame(function loop () {
        requestAnimFrame(loop);
        game.world.update();
        render();
      }, canvas);

      setInterval(function () {
        DOM_render();
      }, 100);
    }
  }

}(window.BlazingRace));
