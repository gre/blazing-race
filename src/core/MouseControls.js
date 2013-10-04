(function(ns){

  var makeEvent = BlazingRace.util.makeEvent;
  var b2Vec2 = Box2D.Common.Math.b2Vec2;

  ns.MouseControls = function (node) {
    var self = this;
    var position = { x: 0, y: 0 };
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
      self.E.pub("position", position);
    }

    function getPosition () {
      return new b2Vec2(position.x, position.y);
    }

    self.getCursorPosition = getPosition;

    function onMouseMove (e) {
      syncCanvasPosition(e);
    }
    function onMouseDown (e) {
      e.preventDefault();
      syncCanvasPosition(e);
      self.E.pub("usePower", getPosition());
    }

    self.start = function () {
      node.on("mousemove", onMouseMove);
      node.on("mousedown", onMouseDown);
      self.E.pub("started");
    }

    self.stop = function () {
      node.off("mousemove", onMouseMove);
      node.off("mousedown", onMouseDown);
      self.E.pub("stopped");
    }
  }

}(window.BlazingRace));
