(function(ns){

  var makeEvent = BlazingRace.util.makeEvent;

  var b2Vec2 = Box2D.Common.Math.b2Vec2
  , b2BuoyancyController = Box2D.Dynamics.Controllers.b2BuoyancyController
  , b2World = Box2D.Dynamics.b2World
  ,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
  ,	b2BodyDef = Box2D.Dynamics.b2BodyDef
  ,	b2Body = Box2D.Dynamics.b2Body
  ,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
  ,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
  ;


  ns.World = function (_map) {
    var self = this;
    self.map = _map;
    self.width = _map.width;
    self.height = _map.height;
    self.gravity = new b2Vec2(0, 10);
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

    function asArray (raw) {
      var arr = [];
      for (var j = 0; j<raw.length/2; ++j) {
        arr[j] = new b2Vec2((raw[2*j])/DRAW_SCALE, (raw[2*j+1])/DRAW_SCALE);
      }
      return arr;
    }

    function init (world) {
      var fixDef = new b2FixtureDef;
      fixDef.density = groundFixDef.density;
      fixDef.friction = groundFixDef.friction;
      fixDef.restitution = groundFixDef.restitution;
      fixDef.shape = new b2PolygonShape;
      var bodyDef = new b2BodyDef;
      bodyDef.type = b2Body.b2_staticBody;

      for (var type in self.map.objects) {
        var value = self.map.objects[type];
        if (type == "grounds") {
          for (var i = 0; i<value.length; ++i) {
            var arr = asArray(value[i]);
            fixDef.shape.SetAsArray(arr, arr.length);
            bodyDef.position.Set(0,0);
            var ground = world.CreateBody(bodyDef);
            ground.CreateFixture(fixDef);
            ground.SetUserData({ type: "ground" });
          }
        }
        if (type == "candles") {
          for (var i = 0; i<value.length; ++i) {
            var raw = value[i];
            var x = raw[0], y = raw[1];
            fixDef.shape.SetAsBox(0.3, 0.3);
            bodyDef.position.Set(x/DRAW_SCALE, y/DRAW_SCALE);
            var body = world.CreateBody(bodyDef);
            body.SetUserData({ type: "candle" });
            body.CreateFixture(fixDef);
            self.candles.push(body);
          }
        }            


        if (type == "waters") {
          for (var i = 0; i<value.length; ++i) {
            var fixDef = new Box2D.Dynamics.b2FixtureDef();
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;
            fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
            var arr = asArray(value[i]);
            fixDef.shape.SetAsArray(arr, arr.length);

            var bodyDef = new Box2D.Dynamics.b2BodyDef();
            bodyDef.position.Set(0,0);

            var water = world.CreateBody(bodyDef);
            water.CreateFixture(fixDef);
            water.SetUserData({ type: "water" });
            self.waterController.AddBody(water);
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

    self.createPlayerBody = function (size, x, y) {
      var bodyDef = new b2BodyDef;
      bodyDef.type = b2Body.b2_dynamicBody;
      bodyDef.position.x = x;
      bodyDef.position.y = y;
      //bodyDef.angularDamping = 0.2;
      var player = self.world.CreateBody(bodyDef);
      var fixDef = new b2FixtureDef;
      fixDef.density = 1.0;
      fixDef.friction = 0.2;
      fixDef.restitution = 0.1;
      fixDef.shape = new b2CircleShape(size);
      player.CreateFixture(fixDef);
      player.SetUserData({ type: "player" });
      return player;
    }

    self.update = update;
    self.start = function () {
      init(self.world);
    }

    // RENDERING
    var mapTexture = $('<canvas width="'+self.width+'" height="'+self.height+'" />')[0];
    var mapTextureCtx = mapTexture.getContext("2d");
    
    function cacheMapTexture () {
      drawMapTexture(mapTextureCtx);
    }

    function fillPolygon (vertices, s, drawScale) {
      var vertexCount = vertices.length;
      if (!vertexCount) return;
      s.beginPath();
      s.moveTo( Math.floor(vertices[0].x * drawScale), Math.floor(vertices[0].y * drawScale) );
      for (var i = 1; i < vertexCount; i++) {
        s.lineTo( Math.floor(vertices[i].x * drawScale), Math.floor(vertices[i].y * drawScale) );
      }
      s.lineTo( Math.floor(vertices[0].x * drawScale), Math.floor(vertices[0].y * drawScale) );
      s.closePath();
      s.fill();
    }
    function rawToPositions (arr) {
      var a = [];
      for (var i = 0; i < arr.length/2; ++ i)
        a.push({ x: arr[i*2], y: arr[i*2+1] });
      return a;
    }

    function drawMapTexture (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      var waters = self.map.objects.waters;
      ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
      for (var i = 0; i < waters.length; ++i) {
        fillPolygon(rawToPositions(waters[i]), ctx, 1);
      }

      var grounds = self.map.objects.grounds;
      ctx.fillStyle = 'rgb(0, 0, 0)';
      for (var i = 0; i < grounds.length; ++i) {
        fillPolygon(rawToPositions(grounds[i]), ctx, 1);
      }
    }

    function copyMapTexture (ctx) {
      ctx.drawImage(mapTexture, 0, 0);
    }

    function drawBackground (ctx) {
      ctx.fillStyle = 'rgb(100, 70, 50)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    self.setup = function (loader) {
      cacheMapTexture();
    }

    self.render = function (ctx) {
      copyMapTexture(ctx);
    }
    
  }

}(window.BlazingRace));
