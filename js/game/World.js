(function(ns){

  var makeEvent = BlazingRace.util.makeEvent;

  var b2Vec2 = Box2D.Common.Math.b2Vec2
  , b2BuoyancyController = Box2D.Dynamics.Controllers.b2BuoyancyController
  , b2World = Box2D.Dynamics.b2World
  , b2Shape = Box2D.Collision.Shapes.b2Shape
  ,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
  ,	b2BodyDef = Box2D.Dynamics.b2BodyDef
  , b2Transform = Box2D.Common.Math.b2Transform
  ,	b2Body = Box2D.Dynamics.b2Body
  ,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
  , b2ContactListener = Box2D.Dynamics.b2ContactListener
  , smoothstep = BlazingRace.util.smoothstep
  ;

  // TODO clean code and comments
  ns.World = function (_map) {
    var self = this;
    self.map = _map.data; // FIXME
    self.width = self.map.width;
    self.height = self.map.height;
    self.gravity = new b2Vec2(0, -10);
    self.world = new b2World(self.gravity, true);

    self.candles = [];

    self.E = makeEvent({});

    var fluid = new b2BuoyancyController();
    fluid.density = 1.2;
    fluid.offset = 0;
    self.waterController = fluid;
    self.world.AddController(fluid);

    var bodyInAreaForArea = {
      water: [],
      noOxygen: []
    };
    var shapesForArea = {
      water: [],
      noOxygen: []
    };

    function indexOfBodyArea (body, area) {
      var arr = bodyInAreaForArea[area];
      for (var i=0; i<arr.length; ++i)
        if (arr[i] === body)
          return i;
      return -1;
    }
    function addInArea (body, area) {
      bodyInAreaForArea[area].push(body);
    }
    function removeFromArea (body, area) {
      bodyInAreaForArea[area].splice(indexOfBodyArea(body, area), 1);
    }
    function isInArea (body, area) {
      return indexOfBodyArea(body, area) != -1;
    }

    var areaBound = [];
    self.bindArea = function (body, areaType, enter, leave) {
      areaBound.push(arguments);
    }
    self.unbindArea = function (body, areaType) {
      for (var i=0; i<areaBound.length; ++i) {
        var bound = areaBound[i];
        if (bound[0] == body && (areaType===undefined || bound[1] == areaType )) {
          areaBound.splice(i, 1);
          return;
        }
      }
    }
    self.checkAreas = function () {
      for (var i=0; i<areaBound.length; ++i) {
        self.checkArea.apply(this, areaBound[i]);
      }
    }

    function shapesCollideWithBody (shapes, body, onlyCheckBodyPosition) {
      var tId = new b2Transform(); tId.SetIdentity();
      var bodyT = body.GetTransform();
      if (onlyCheckBodyPosition) {
        var p = body.GetPosition();
        for (var i = 0; i < shapes.length; ++i)
          if (shapes[i].TestPoint(tId, p))
            return true;
        return false;
      }
      else {
        for (var f=body.GetFixtureList(); f; f=f.GetNext()) {
          var s = f.GetShape();
          for (var i = 0; i < shapes.length; ++i)
            if (b2Shape.TestOverlap(shapes[i], tId, s, bodyT))
              return true;
        }
        return false;
      }
    }

    self.checkArea = function (body, areaType, enter, leave) {
      var inArea = isInArea(body, areaType);
      var collide = shapesCollideWithBody (shapesForArea[areaType], body, true);
      // something has changed
      if (inArea != collide) {
        if (collide) {
          addInArea(body, areaType);
          switch (areaType) {
            case "water": self.waterController.AddBody(body); break;
          }
          enter && enter();
        }
        else {
          removeFromArea(body, areaType);
          switch (areaType) {
            case "water": self.waterController.RemoveBody(body); break;
          }
          leave && leave();
        }
      }
    }

    var collisionBound = [];

    // Bind a collision between a given body 
    // and another object having objectType in user data
    self.bindCollision = function (body, objectType, onContact) {
      collisionBound.push(arguments);
    }

    var contactListener = new b2ContactListener;
    contactListener.BeginContact = function (contact) {
      var aBody = contact.GetFixtureA().GetBody();
      var bBody = contact.GetFixtureB().GetBody();
      var aData = aBody.GetUserData();
      var bData = bBody.GetUserData();

      for (var i = 0; i < collisionBound.length; ++i) {
        var c = collisionBound[i];
        if( aBody === c[0] && bData && bData.type == c[1] )
          c[2](aBody, bBody, aData, bData);
        if( bBody === c[0] && aData && aData.type == c[1] )
          c[2](bBody, aBody, bData, aData);
      }
    }
    self.world.SetContactListener(contactListener);


    self.forAllShapeInCamera = function (camera, callback) {
      self.world.QueryShape(callback, camera.getShape());
    }


    var groundFixDef = new b2FixtureDef;
    groundFixDef.density = 1.0;
    groundFixDef.friction = 0.5;
    groundFixDef.restitution = 0.1;

    function forEachPolygons (obj, fun) {
      for (var f=0; f<obj.faces.length; ++f) {
        var face = obj.faces[f];
        var vertices = [];
        for (var v=0; v<face.length; ++v) {
          var vertice = obj.vertices[face[v]];
          vertices.push(new b2Vec2(vertice.x, vertice.y));
        }
        fun(vertices);
      }
    }

    function init (world) {
      var fixDef = new b2FixtureDef;
      fixDef.density = groundFixDef.density;
      fixDef.friction = groundFixDef.friction;
      fixDef.restitution = groundFixDef.restitution;
      fixDef.shape = new b2PolygonShape;
      var bodyDef = new b2BodyDef;
      bodyDef.type = b2Body.b2_staticBody;

      for (var type in self.map) {
        var value = self.map[type];
        if (type == "ground") {
          for (var i = 0; i<value.length; ++i) {
            forEachPolygons(value[i], function (arr) {
              fixDef.shape.SetAsArray(arr, arr.length);
              bodyDef.position.Set(0,0);
              var ground = world.CreateBody(bodyDef);
              ground.CreateFixture(fixDef);
              ground.SetUserData({ type: "ground" });
            });
          }
        }
        else if (type == "candles") {
          for (var i = 0; i<value.length; ++i) {
            var raw = value[i];
            var x = raw.x, y = raw.y;
            fixDef.shape.SetAsBox(0.4, 0.6);
            bodyDef.position.Set(x, y);
            var body = world.CreateBody(bodyDef);
            body.SetUserData({ type: "candle" });
            body.CreateFixture(fixDef);
            self.candles.push(body);
          }
        }
        else if (type == "water" || type == "noOxygen") {
          for (var i = 0; i<value.length; ++i) {
            forEachPolygons(value[i], function (arr) {
              shapesForArea[type].push( b2PolygonShape.AsArray(arr, arr.length) );
            });
          }
        }
      }
    }

    var i;
    function update() {
      self.world.Step(1 / 60, 10, 10);
      self.checkAreas();
      self.E.pub("update", ++i);
      self.world.ClearForces();
    }

    var loopInterval;
    self.start = function () {
      i = 0;
      init(self.world);
      loopInterval = setInterval(update, 1000/60);
    }
    self.stop = function () {
      clearInterval(loopInterval);
    }

    // RENDERING
    
    // Background rendering
    self.getBackgroundRenderable = function(){ 
      var loader;
      var mapBgTexture;
      var parallax = { x: 0.7, y: 0.6 };

      function generateMapBgTexture (scale) {
        mapBgTexture = loader.getResource("map_background", self.width*scale, self.height*scale);
      }
      
      return {
        zindex: -20,
        render: function (ctx, camera) {
          ctx.save();
          camera.translateContextWithParallax(ctx, parallax.x, parallax.y);
          ctx.drawImage(mapBgTexture, 0, 0);
          ctx.restore();
        },
        setup: function (l, camera) {
          loader = l;
          generateMapBgTexture(camera.scale);
          camera.E.sub("scale", generateMapBgTexture);
        }
      }
    };

    // Map rendering
    self.getMapRenderable = function(){
      var loader;
      var mapTexture;

      function generateMapTexture (scale) {
        mapTexture = loader.getResource("map", scale*self.width, scale*self.height);
      }
      return {
        zindex: -10,
        render: function (ctx, camera) {
          ctx.save();
          camera.translateContext(ctx);
          ctx.drawImage(mapTexture, 0, 0);
          ctx.restore();
        },
        setup: function (l, camera) {
          loader = l;
          generateMapTexture(camera.scale);
          camera.E.sub("scale", generateMapTexture);
        }
      }
    };

    // Candles rendering
    self.getCandlesRenderable = function(){

      var candleOn, candleOff;
      var loader;

      function generateCandle (scale) {
        var img = loader.getResource("candleOn");
        var w = scale;
        var h = Math.floor(w*img.height/img.width);
        candleOn = loader.getResource("candleOn", w, h);
        candleOff = loader.getResource("candleOff", w, h);
      }

      function drawCandle (ctx, candle, camera, i) {
        var position = candle.GetPosition();
        var fixture = candle.GetFixtureList();
        var lighted = fixture.GetBody().GetUserData().lighted;

        var p = camera.realPositionToCanvas(position);
        var w = ctx.canvas.width;
        var h = ctx.canvas.height;

        var visible = (function (x, y) {
          return -candleOn.width/2 < x && x < w+candleOn.width/2 && 
                -candleOn.height/2 < y && y < h+candleOn.height/2;
        }(p.x, p.y));

        if (visible) {
          ctx.save();
          ctx.translate(Math.floor(p.x-candleOn.width/2), Math.floor(p.y+candleOn.width/2-candleOn.height));
          if (lighted) {
            ctx.fillStyle = 'rgb(255, 200, 150)';
            ctx.drawImage(candleOn, 0, 0);
          }
          else {
            ctx.fillStyle = 'rgb(200, 170, 160)';
            ctx.drawImage(candleOff, 0, 0);
          }
          ctx.restore();
        }
      }

      return {
        zindex: -5,
        render: function (ctx, camera) {
          for (var i = 0; i < self.candles.length; ++i) {
            drawCandle(ctx, self.candles[i], camera, i);
          }
        },
        setup: function (l, camera) {
          loader = l;
          generateCandle(camera.scale);
          camera.E.sub("scale", generateCandle);
        }
      }
    };

  }

}(window.BlazingRace));
