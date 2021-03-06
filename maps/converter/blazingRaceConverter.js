(function(){


var Z_GROUND = 0
  , Z_CANDLE = 1
  , Z_START = 2
  , Z_WATER = -1
  , Z_NO_OXYGEN = -2
  ;

function Converter (collada) {

  this.convert = function () {
    var loader = new THREE.ColladaLoader();
    var xml = (new DOMParser()).parseFromString(collada, "text/xml");

    var c = loader.parse(xml);

    var map = {
        candles: [],
        ground: [],
        water:  [],
        noOxygen: []
    };

    var scale = { x: 1, y: 1 };
    var boundingBox;
    
    function boundWithObjects () {
      boundingBox = _(c.scene.children).chain().
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
      return true;
    }

    function boundWithMarks () {
      var topleft = _(c.scene.children).filter(function(node){
        return node.name=="topleft" || node.name=="top_left";
      }).map(function(node){
        return node.position;
      })[0];
      var bottomright = _(c.scene.children).filter(function(node){
        return node.name=="bottomright" || node.name=="bottom_right";
      }).map(function(node){
        return node.position;
      })[0];
      if (!topleft || !bottomright) return false;
      boundingBox = {
        min: {
          x: Math.min(topleft.x, bottomright.x),
          y: Math.min(topleft.y, bottomright.y)
        },
        max: {
          x: Math.max(topleft.x, bottomright.x),
          y: Math.max(topleft.y, bottomright.y)
        }
      };
      return true;
    }


    function addCandle (node) {
      map.candles.push({ x: node.position.x, y: node.position.y });
    }

    function setWorldScale (node) {
      scale = { x: node.scale.x, y: node.scale.y };
    }

    function setStart (node) {
      map.start = [{ x: node.position.x, y: node.position.y }];
    }

    /*
     Return area of a simple (ie. non-self-intersecting) polygon.
     Will be negative for counterclockwise winding.
     */
    function poly_area (verts) {
      var accum = 0.0;
      for (var i = 0; i < verts.length; ++ i) {
        var j = (i + 1) % verts.length
        accum += verts[j].x * verts[i].y - verts[i].x * verts[j].y
      }
      return accum / 2
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

          // reverse if clockwise
          if (poly_area(_(p).map(function (f) {
            return g.vertices[f].position
          })) >= 0) {
            p.reverse();
          }
          return p;
        })
      }
    }

    function addGround (node) {
      map.ground.push(mapVerticesAndFaces(node));
    }

    function addWater (node) {
      map.water.push(mapVerticesAndFaces(node));
    }

    function addNoOxygen (node) {
      map.noOxygen.push(mapVerticesAndFaces(node));
    }

    _(c.scene.children).each(function(node){
      switch (Math.round(node.position.z)) {
        case Z_GROUND: return addGround(node);
        case Z_CANDLE: return addCandle(node);
        case Z_START:  return setStart(node);
        case Z_WATER:  return addWater(node);
        case Z_NO_OXYGEN: return addNoOxygen(node);
      }
    });

    boundWithMarks() || boundWithObjects();

    setWorldScale(_(c.scene.children).filter(function(node){
      return node.name=="world_size";
    })[0]);

    map.width = (boundingBox.max.x-boundingBox.min.x)/scale.x;
    map.height = (boundingBox.max.y-boundingBox.min.y)/scale.y;

    function transformPosition (p) {
      p.x = (p.x-boundingBox.min.x)/scale.x;
      p.y = (p.y-boundingBox.min.y)/scale.y;
    }

    transformPosition(map.start[0]);
    _(map.candles).each(transformPosition);
    _(map.ground).each(function (g) {
      _(g.vertices).each(transformPosition);
    });
    _(map.water).each(function (g) {
      _(g.vertices).each(transformPosition);
    });
    _(map.noOxygen).each(function (g) {
      _(g.vertices).each(transformPosition);
    });

    return map;
  }
}

window.Converter = Converter;

}());
