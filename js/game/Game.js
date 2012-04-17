(function(ns){

  var makeEvent = BlazingRace.util.makeEvent
  ;

  var b2Vec2 = Box2D.Common.Math.b2Vec2
  ;

  ns.Game = function (world) {
    var self = this;
    
    self.E = makeEvent({});
    self.startTime = 0;

    function stop() {

    }

    function start() {
      self.startTime = +new Date();
    }

    self.start = function () {
      start();
      self.E.pub("started");
    }
    self.stop = function () {
      stop();
      self.E.pub("stopped");
    }
  }

}(window.BlazingRace));
