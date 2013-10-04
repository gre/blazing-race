/**
 * ~ Blazing Race ~
 * Apache Licence 2.0
 * Gaëtan Renaudeau <renaudeau.gaetan@gmail.com>
 * 2012
 */
(function(){

  DEV_MODE = location.host.match("localhost");

  var TimeTrialGame = BlazingRace.TimeTrialGame
  , ImageManager = BlazingRace.ImageManager 
  , Map = BlazingRace.Map
  ;

function stage (id) {
  $('#'+id).show().siblings('.stage').hide();
}

function main (level) {
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
      var game = new TimeTrialGame(node, map, loader);
      game.start();
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
