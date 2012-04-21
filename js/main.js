/**
 * ~ Blazing Race ~
 * Apache Licence 2.0
 * Gaëtan Renaudeau <renaudeau.gaetan@gmail.com>
 * 2012
 */
(function(){

  var GameRecorder = BlazingRace.GameRecorder
  , Player = BlazingRace.Player
  , Game = BlazingRace.Game
  , World = BlazingRace.World 
  , ImageManager = BlazingRace.ImageManager 
  , Camera = BlazingRace.Camera 
  , MouseControls = BlazingRace.MouseControls 
  , TouchControls = BlazingRace.TouchControls 
  , Renderer = BlazingRace.Renderer
  , Map = BlazingRace.Map
  ;

function stage (id) {
  $('#'+id).show().siblings('.stage').hide();
}

function main (level) {
  var isMobile = /ipad|iphone|android/i.test(navigator.userAgent);
  var node = $("#game");

  stage('loader');

  var map = new Map(level);

  map.load(function (data) {

    var loader = new ImageManager(map.getImages(), map.getImagesBytesLength());

    loader.E.sub("progress", function (p) {
      $("#loader .loader").
        attr("max", p.total).
        attr("value", p.value).
        text(Math.floor(100*p.value/p.total)+" %");
    });

    loader.E.sub("error", function (e) {
      $('#loader h2').text("Loading failed... Try to reload");
      $("#loader .error").append($("<li />").text(e.msg));
    });

    loader.load(function(){
      stage('game');

      var world = new World(map);
      var controls = isMobile ? new TouchControls(node) 
                              : new MouseControls(node);
      var camera = new Camera(true);
      var game = new Game(world);
      var rendering = new Renderer(node.find("canvas.game")[0]);
      var recorder = new GameRecorder(game);
      var player = new Player(world, map.data.start[0].x, map.data.start[0].y);

      camera.setWorldSize(world.width, world.height);

      rendering.setLayers([
        world.getBackgroundRenderable(),
        player.getBallRenderable(),
        player.getFlameRenderable(),
        world.getMapRenderable(),
        world.getCandlesRenderable(),
        player.getCandlesIndicatorRenderable(world.candles)
      ]);

      var lastWidth, lastHeight;
      $(window).resize(function () {
        var w = Math.max(250, Math.floor($(window).width()));
        var h = Math.max(200, Math.floor($(window).height()));
        if (w !== lastWidth || h !== lastHeight) {
          node.width(w).height(h);
          camera.resize(w, h);
          rendering.resize(w, h);
        }
      }).resize();

      var gameRunning = false;
      game.E.sub("started", function (i) {
        gameRunning = true;
        controls.start();
        rendering.addLayer( player.getControlsRenderable(), 10 );

      });
      game.E.sub("stopped", function (i) {
        gameRunning = false;
        controls.stop();
        rendering.removeLayer( player.getControlsRenderable() );
      });

      controls.E.sub("stopped", function (){
        player.setCursor(null);
      });
      controls.E.sub("started", function (){
        player.setCursor({ x: 0, y: 0 });
      });

      controls.E.sub("position", function (position) {
        player.setCursor(position); 
      });

      controls.E.sub("usePower", function (canvasPosition) {
        player.usePower( player.getVector(camera.canvasToRealPosition(canvasPosition)) );
      });

      player.E.sub("live", function (i) {
        if (gameRunning)
          controls.start();
      });
      player.E.sub("die", function (i) {
        controls.stop();
      });

      world.E.sub("update", function (i) {
        camera.focusOn(player.getPosition());
      });


      function won () {
        return player.candleCount >= world.map.candles.length;
      }
      function checkGameState () {
        if (won())
          return 1;
        if (player.isDead())
          return -1;
        return 0;
      }

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
            if (checkGameState() == -1) {
              player.reignition();
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

          var state = checkGameState();
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
          $end.find(".value").remove();
          $end.append('<div class="value">'+seconds+'</div>');
          setTimeout(function(){
            $end.find(".value").addClass("change");
          }, 100);
        }
        else if (seconds<=0) {
          $end.find(".message").empty();
          $end.find(".value").empty();
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

      function start () {
        world.start();
        player.start();
        rendering.start(camera, loader);

        $end.show().find(".message").text("Ready?");
        setInterval(function () {
          DOM_render();
        }, 100);
      }

      start();

      BlazingRace.game = game; // save the game for debugging

    });

  });

}

stage('menu');

$('nav .menu').click(function (e) {
  e.preventDefault();
  stage('menu');
});

$('#menu .timeTrial').click(function (e) {
  e.preventDefault();
  stage('timeTrial');
});

$('#timeTrial .level').click(function (e) {
  e.preventDefault();
  main($(this).attr("data-levelName"));
});

}());
