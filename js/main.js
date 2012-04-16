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
  , TouchControls = BlazingRace.MouseControls 
  , Renderer = BlazingRace.Renderer
  ;

function stage (id) {
  $('#'+id).show().siblings('.stage').hide();
}

function main (level) {
  var isMobile = /ipad|iphone|android/i.test(navigator.userAgent);
  var node = $("#game");

  stage('loader');
  $.getJSON("maps/"+level+".json", function (map) {
    var W = node.width();
    var H = node.height();

    var loader = new ImageManager({
      map_background: "maps/"+level+"_background.jpg",
      map: "maps/"+level+".png",
      coal: "images/coal.png",
      candleOff: "images/candle-off.png",
      candleOn: "images/candle-on.png"
    }, 5445395); // output of wc -c

    loader.E.sub("progress", function (p) {
      $("#loader .loader").
        attr("max", p.total).
        attr("value", p.value).
        text(Math.round(100*p.value/p.total)+" %");
    });

    loader.E.sub("error", function (e) {
      $('#loader h2').text("Loading failed... Try to reload");
      $("#loader .error").append($("<li />").text(e.msg));
    });

    loader.start();

    loader.ready(function(){
      stage('game');

      // FIXME : some constructor should not depends on other components, try to avoid almost all dependencies and use loosely coupled events
      // TODO new Map(map);
      var world = new World(map);
      var controls = isMobile ? new TouchControls(node) : new MouseControls(node);
      var camera = new Camera(world, W, H);
      var game = new Game(world, camera);
      var rendering = new Renderer(game, W, H, node, loader);
      var recorder = new GameRecorder(game);
      var player = new Player(game, map.start[0].x, map.start[0].y, controls, camera);
      game.player = player; // oh fuck!

      // TODO I like these lines, need to rewrite lot of things like this:

      var gameRunning = false;
      game.E.sub("started", function (i) {
        gameRunning = true;
        controls.start();
      });
      game.E.sub("stopped", function (i) {
        gameRunning = false;
        controls.stop();
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

      world.start();
      player.start();
      rendering.start();

      BlazingRace.game = game; // save the game for debugging

      var lastWidth, lastHeight;
      $(window).resize(function () {
        var w = Math.max(250, Math.floor($(window).width()-1));
        var h = Math.max(200, Math.floor($(window).height()-1));
        if (w !== lastWidth || h !== lastHeight) {
          node.width(w).height(h);
          camera.resize(w, h);
          rendering.resize(w, h);
        }
      }).resize();
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
