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
  var isMobile = /ipad|iphone|android/i.test(navigator.userAgent);
  var node = $("#game");

  var level = "poc";

  $.getJSON("maps/"+level+".json", function (map) {
    var W = node.width();
    var H = node.height();

    var loader = new ImageManager({
      map_background: "maps/"+level+"_background.jpg",
      map: "maps/"+level+".png",
      coal: "images/coal.png",
      candleOff: "images/candle-off.png",
      candleOn: "images/candle-on.png"
    });

    var loadInterval = setInterval(function() {
      $('.front .value').text(Math.floor(loader.progress()*100)+"%");
    }, 100);
    
    $('canvas').hide();

    loader.ready(function(){
      clearInterval(loadInterval);
      $('canvas').show();

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

      game.E.sub("started", function (i) {
        controls.start();
      });
      game.E.sub("stopped", function (i) {
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
        var w = Math.max(250, $(window).width()-1);
        var h = Math.max(200, $(window).height()-30);
        if (w !== lastWidth || h !== lastHeight) {
          node.width(w).height(h);
          camera.resize(w, h);
          rendering.resize(w, h);
        }
      }).resize();
    });

  });

}());

});
