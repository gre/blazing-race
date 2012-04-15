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
  ;


  ns.World = function (_map) {
    var self = this;
    self.map = _map;
    self.width = _map.width;
    self.height = _map.height;
    self.gravity = new b2Vec2(0, -10);
    self.world = new b2World(self.gravity, true);

    self.candles = [];

    self.E = makeEvent({});

    var waterShapes = [];

    var fluid = new b2BuoyancyController();
    fluid.density = 1.1;
    fluid.offset = 0;
    self.waterController = fluid;
    self.world.AddController(fluid);

    var fluidsBound = [];
    self.bindFluids = function (body, enter, leave) {
      fluidsBound.push(arguments);
    }
    self.unbindFluids = function (body) {
      for (var i=0; i<fluidsBound.length; ++i) {
        var bound = fluidsBound[i];
        if (bound[0] == body) {
          fluidsBound.splice(i, 1);
          return;
        }
      }
    }

    self.checkFluids = function () {
      for (var i = 0; i < fluidsBound.length; ++ i) {
        self.checkFluid.apply(this, fluidsBound[i]);
      }
    }

    self.checkFluid = function (body, enter, leave) {
      var inFluid = false;
      for (var o=self.waterController.GetBodyList(); o; o=o.nextBody) {
        var b = o.body;
        if (b === body) {
          inFluid = true;
          break;
        }
      }
      var collideWater = false;
      var t = new b2Transform();
      t.SetIdentity();
      for (var f=body.GetFixtureList(); f && !collideWater; f=f.GetNext()) {
        var aabb = f.GetAABB();
        var s = f.GetShape();
        t.position = new b2Vec2(0, (aabb.lowerBound.y-aabb.upperBound.y)/2); // hacky..
        for (var w = 0; w < waterShapes.length && !collideWater; ++w) {
          var water = waterShapes[w];
          collideWater = b2Shape.TestOverlap(water, t, s, body.GetTransform());
        }
      }
      // something has changed
      if (inFluid != collideWater) {
        if (collideWater) {
          self.waterController.AddBody(body);
          enter && enter();
        }
        else {
          self.waterController.RemoveBody(body);
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
        if (type == "grounds") {
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
        if (type == "candles") {
          for (var i = 0; i<value.length; ++i) {
            var raw = value[i];
            var x = raw.x, y = raw.y;
            fixDef.shape.SetAsBox(0.4, 0.5);
            bodyDef.position.Set(x, y);
            var body = world.CreateBody(bodyDef);
            body.SetUserData({ type: "candle" });
            body.CreateFixture(fixDef);
            self.candles.push(body);
          }
        }
        if (type == "waters") {
          for (var i = 0; i<value.length; ++i) {
            forEachPolygons(value[i], function (arr) {
              waterShapes.push( b2PolygonShape.AsArray(arr, arr.length) );
            });
          }
        }
      }
    }


    var i = 0;
    function update() {
      self.world.Step(1 / 60, 10, 10);
      self.checkFluids();
      self.E.pub("update", ++i);
      self.world.ClearForces();
    }

    self.update = update;

    self.start = function () {
      init(self.world);
    }

    // RENDERING

    // map
    var mapImg;

    var mapTexture = $('<canvas></canvas>')[0], 
        mapTextureCtx = mapTexture.getContext("2d");
    function generateMapTexture (camera) {
      mapTexture.width = self.width * camera.scale;
      mapTexture.height = self.height * camera.scale;
      mapTextureCtx.drawImage(mapImg, 
          0, 0, mapImg.width, mapImg.height,
          0, 0, mapTexture.width, mapTexture.height);
    }

    var lastScale;
    function generateMapTextureIfChanged (camera) {
      if (camera.scale !== lastScale) {
        lastScale = camera.scale;
        generateMapTexture(camera);
      }
    }

    // map background
    var mapBgImg;
    var mapBgTexture = $('<canvas></canvas>')[0], 
        mapBgTextureCtx = mapBgTexture.getContext("2d");
    var parallax = { x: 0.7, y: 0.6 };
    function generateMapBgTexture (camera) {
      mapBgTexture.width = self.width * camera.scale;
      mapBgTexture.height = self.height * camera.scale;
      for (x=0; x<mapBgTexture.width; x += mapBgImg.width) {
        for (y=0; y<mapBgTexture.height; y += mapBgImg.height) {
          mapBgTextureCtx.drawImage(mapBgImg, x, y);
        }
      }
    }

    var lastScaleBg;
    function generateMapBgTextureIfChanged (camera) {
      if (camera.scale !== lastScaleBg) {
        lastScaleBg = camera.scale;
        generateMapBgTexture(camera);
      }
    }


    self.setup = function (loader) {
      mapImg = loader.getResource("map");
      mapBgImg = loader.getResource("map_background");
    }

    self.renderBackground = function (ctx, camera) {
      generateMapBgTextureIfChanged(camera);
      ctx.save();
      camera.translateContextWithParallax(ctx, parallax.x, parallax.y);
      ctx.drawImage(mapBgTexture, 0, 0);
      ctx.restore();
    }

    self.renderMap = function (ctx, camera) {
      generateMapTextureIfChanged(camera);
      ctx.save();
      camera.translateContext(ctx);
      ctx.drawImage(mapTexture, 0, 0);
      ctx.restore();
    }
    
  }

}(window.BlazingRace));
