(function(ns){

  var makeEvent = BlazingRace.util.makeEvent;

  var b2Vec2 = Box2D.Common.Math.b2Vec2
  , b2BuoyancyController = Box2D.Dynamics.Controllers.b2BuoyancyController
  , b2World = Box2D.Dynamics.b2World
  ,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
  ,	b2BodyDef = Box2D.Dynamics.b2BodyDef
  ,	b2Body = Box2D.Dynamics.b2Body
  ,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
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

    var fluid = new b2BuoyancyController();
    fluid.offset = -70;
    fluid.density = 1.2;
    self.waterController = fluid;
    self.world.AddController(fluid);

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
            fixDef.shape.SetAsBox(0.3, 0.3);
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
              fixDef.shape.SetAsArray(arr, arr.length);

              var bodyDef = new Box2D.Dynamics.b2BodyDef();
              bodyDef.position.Set(0,0);

              var water = world.CreateBody(bodyDef);
              water.CreateFixture(fixDef);
              water.SetUserData({ type: "water" });
              //self.waterController.AddBody(water);
            });
          }
        }
      }
    }

    var i = 0;
    function update() {
      self.world.Step(1 / 60, 10, 10);
      self.E.pub("update", ++i);
      self.world.ClearForces();
    }

    self.update = update;
    self.start = function () {
      init(self.world);
    }

    // RENDERING
    var mapTexture;

    self.setup = function (loader) {
      mapTexture = loader.getResource("maps_01");
    }

    self.render = function (ctx, camera) {
      ctx.save();
      // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
      var scalex = (camera.scale*(self.width / mapTexture.width));
      var scaley = (camera.scale*(self.height / mapTexture.height));
      var sx = -camera.x/scalex;
      var sy = (camera.scale*self.height+camera.y-camera.height)/scaley;
      var sw = camera.width/scalex;
      var sh = camera.height/scaley;
      var dx = 0;
      var dy = 0;
      var dw = camera.width;
      var dh = camera.height;
      sx = Math.floor(sx);
      sy = Math.floor(sy);
      sw = Math.floor(sw);
      sh = Math.floor(sh);
      ctx.drawImage(mapTexture, sx, sy, sw, sh, dx, dy, dw, dh);
      ctx.restore();
    }
    
  }

}(window.BlazingRace));
