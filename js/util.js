(function(ns){
ns.util = {
  clamp: function (min, max, value) { return Math.max(min, Math.min(max, value)) },
  smoothstep: function (min, max, value) { return Math.max(0, Math.min(1, (value-min)/(max-min))); },
  makeEvent: function (_){return {
    pub:function (a,b,c,d){for(d=-1,c=[].concat(_[a]);c[++d];)c[d](b)},
    sub:function (a,b){(_[a]||(_[a]=[])).push(b)},
    del:function (a,b){if(_[a]){
      if (b) {
        var i = $.indexOf(_[a], b);i>=0 && _[a].splice(i, 1);
      }
      else {
        _[a]=[];
      }
    }
    }
  }}
}
}(window.BlazingRace=window.BlazingRace||{}));
