(function(){


var Z_GROUND = 0
  , Z_CANDLE = 1
  , Z_START = 2
  , Z_WATER = -1
  , Z_NO_OXYGEN = -2
  , Z_WORLD_SCALE = -10
  ;

function Converter (collada) {

  this.convert = function () {
    var loader = new THREE.ColladaLoader();
    var xml = (new DOMParser()).parseFromString(collada, "text/xml");

    var c = loader.parse(xml);
    C = c;

    var map = {
        candles: [],
        grounds: [],
        waters:  [],
        noOxygens: []
    };

    var scale = { x: 1, y: 1 };
    var boundingBox = _(c.scene.children).chain().
      filter(function(node){
        var z = Math.round(node.position.z);
        return (z == Z_GROUND || z == Z_WATER) && node.geometry;
      }).
      map(function (node) { return node.geometry.boundingBox; }).  
      reduce(function (a, b) {
        if (!a) return b;
        if (!b) return a;
        return {
          min: {
            x: Math.min(a.min.x, b.min.x),
            y: Math.min(a.min.y, b.min.y)
          },
          max: {
            x: Math.max(a.max.x, b.max.x),
            y: Math.max(a.max.y, b.max.y)
          }
        };
      }, null).
      value();

    function addCandle (node) {
      map.candles.push({ x: node.position.x, y: node.position.y });
    }

    function setWorldScale (node) {
      scale = { x: node.scale.x, y: node.scale.y };
    }

    function setStart (node) {
      map.start = [{ x: node.position.x, y: node.position.y }];
    }

    function mapVerticesAndFaces (node) {
      var g = node.geometry;
      return {
        vertices: _(g.vertices).map(function (v) {
          return { x: v.position.x, y: v.position.y };
        }),
        faces: _(g.faces).map(function (f) {
          var p = [];
          if (f.a !== undefined)
            p.push(f.a);
          if (f.b !== undefined)
            p.push(f.b);
          if (f.c !== undefined)
            p.push(f.c);
          if (f.d !== undefined)
            p.push(f.d);
          return p;
        })
      }
    }

    function addGround (node) {
      map.grounds.push(mapVerticesAndFaces(node));
    }

    function addWater (node) {
      map.waters.push(mapVerticesAndFaces(node));
    }

    function addNoOxygen (node) {
      map.noOxygens.push(mapVerticesAndFaces(node));
    }

    _(c.scene.children).each(function(node){
      switch (Math.round(node.position.z)) {
        case Z_GROUND: return addGround(node);
        case Z_CANDLE: return addCandle(node);
        case Z_START:  return setStart(node);
        case Z_WATER:  return addWater(node);
        case Z_NO_OXYGEN: return addNoOxygen(node);
        case Z_WORLD_SCALE: return setWorldScale(node);
      }
    });

    map.width = (boundingBox.max.x-boundingBox.min.x)/scale.x;
    map.height = (boundingBox.max.y-boundingBox.min.y)/scale.y;

    function transformPosition (p) {
      p.x = (p.x-boundingBox.min.x)/scale.x;
      p.y = (p.y-boundingBox.min.y)/scale.y;
    }

    transformPosition(map.start[0]);
    _(map.candles).each(transformPosition);
    _(map.grounds).each(function (g) {
      _(g.vertices).each(transformPosition);
    });
    _(map.waters).each(function (g) {
      _(g.vertices).each(transformPosition);
    });
    _(map.noOxygens).each(function (g) {
      _(g.vertices).each(transformPosition);
    });

    return map;
  }
}

window.Converter = Converter;

}());
