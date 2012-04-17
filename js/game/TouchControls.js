(function(ns){

  var makeEvent = BlazingRace.util.makeEvent;
  var b2Vec2 = Box2D.Common.Math.b2Vec2;

  ns.TouchControls = function (node) {
    var self = this;
    self.E = makeEvent({});

    var started = false;

    function syncCanvasPosition (e) {
      var o = node.offset();
      var x = e.clientX;
      var y = e.clientY;
      if (x !== undefined) {
        position.x = x-(o.left-$(window).scrollLeft());
      }
      if (y !== undefined) {
        position.y = y-(o.top-$(window).scrollTop());
      }
    }

    function getPosition () {
      return new b2Vec2(position.x, position.y);
    }

    function onTouchStart (e) {
      e.preventDefault();
      syncCanvasPosition(e);
      self.E.pub("usePower", getPosition());
    }

    self.isActive = function () {
      return started;
    }

    self.start = function () {
      started = true;
      node.on("touchstart", onTouchStart);
    }

    self.stop = function () {
      started = false;
      node.off("touchstart", onTouchStart);
    }
  }

}(window.BlazingRace));
