(function(ns){
  ns.Chrono = function () {
    var self = this;

    self.reset = function () {
      self.cumulTime = 0;
      self.startTime = null;
      self.stopTime = null;
    }

    self.start = function () {
      if (self.stopTime) {
        self.cumulTime += (self.stopTime - self.startTime);
        self.stopTime = null;
      }
      self.startTime = +new Date();
    }

    self.stop = function () {
      if (!self.stopTime) {
        self.stopTime = +new Date();
      }
    }

    self.getTime = function () {
      var now = +new Date();
      return (self.cumulTime||0) + (self.stopTime||now)-(self.startTime||now);
    }
  }
}(window.BlazingRace));
