(function(ns){
  
  ns.Map = function (name) {
    var self = this;
    self.name = name;
    self.path = "levels/"+name+"/map.json";

    self.data = null;

    self.initData = function (d) {
      self.data = d;
    }

    self.load = function (callback) {
      var req = new XMLHttpRequest();  
      req.onreadystatechange = function (e) {
        if (req.readyState == 4) { 
          self.initData(JSON.parse(req.responseText));
          callback(self.data);
        }
      }
      req.open("GET", self.path, true);
      req.send();
    }

    // TODO move this to data itself (ideally map.json)
    self.getImages = function () {
      return {
        map_background: {
          src: "levels/"+name+"/background.jpg",
          mode: "repeat"
        },
        map: {
          src: "levels/"+name+"/map.png",
        },
        coal: { 
          src: "images/coal.png"
        },
        candleOff: {
          src: "images/candle-off.png"
        },
        candleOn: {
          src: "images/candle-on.png"
        }
      }
    }
    self.getImagesBytesLength = function () {
      return 6526063; // output of wc -c
    }
  }

}(window.BlazingRace));
