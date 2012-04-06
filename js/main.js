/**
 * ~ Blazing Race ~
 * Apache Licence 2.0
 * Gaëtan Renaudeau <renaudeau.gaetan@gmail.com>
 * 2012
 */
$(function(){

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

(function main () {
  window.DRAW_SCALE = 30; // TODO : remove and put somewhere (probably camera)
  var isMobile = /ipad|iphone|android/i.test(navigator.userAgent);
  var node = $("#game");

  $.getJSON("maps/01.json", function (map) {
    var W = node.width();
    var H = node.height();

    var loader = new ImageManager([
      "coal",
      "candle-off",
      "candle-on"
      ], "images/", ".png");

    // FIXME : some constructor should not depends on other components, try to avoid almost all dependencies and use loosely coupled events
    var world = new World(map);
    var controls = isMobile ? new TouchControls(node) : new MouseControls(node);
    var camera = new Camera(world, W, H);
    var game = new Game(world, camera);
    var rendering = new Renderer(game, W, H, node, loader);
    var recorder = new GameRecorder(game);
    var player = new Player(game, map.start.x, map.start.y, controls, camera);
    game.player = player; // oh fuck!

    // TODO I like these lines, need to rewrite lot of things like this:

    game.E.sub("lightCandle", function (candle) {
      player.saveRezPoint();
    });

    game.E.sub("started", function (i) {
      controls.start();
    });
    game.E.sub("stopped", function (i) {
      controls.stop();
    });

    world.E.sub("update", function (i) {
      camera.focusOn(player.getPosition());
    });

    loader.ready(function(){
      world.start();
      player.start();
      rendering.start();
    });

    var lastWidth, lastHeight;
    $(window).resize(function () {
      var w = Math.max(250, $(window).width()-30);
      var h = Math.max(200, $(window).height()-60);
      if (w !== lastWidth || h !== lastHeight) {
        node.width(w).height(h);
        rendering.resize(w, h);
      }
    }).resize();

    BlazingRace.game = game; // save the game for debugging
  });

}());

});
