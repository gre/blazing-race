(function(ns){
  // TODO
  ns.GameRecorder = function (game) {
    var self = this;
    self.game = game;

    function start () {

    }

    function stop () {

    }

    game.E.sub("stopped", stop);
    game.E.sub("started", start);
  }

}(window.BlazingRace));
