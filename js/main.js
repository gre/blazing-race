$(function(){
  var b2Vec2 = Box2D.Common.Math.b2Vec2
  , b2AABB = Box2D.Collision.b2AABB
  , b2Math = Box2D.Common.Math.b2Math
  ,	b2BodyDef = Box2D.Dynamics.b2BodyDef
  ,	b2Body = Box2D.Dynamics.b2Body
  ,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
  ,	b2Fixture = Box2D.Dynamics.b2Fixture
  ,	b2World = Box2D.Dynamics.b2World
  ,	b2MassData = Box2D.Collision.Shapes.b2MassData
  ,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
  ,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
  ,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
  , b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
  ;

  var DRAW_SCALE = 30;

  DEBUG = false;

  function clamp (min, max, value) { return Math.max(min, Math.min(max, value)) }
  function smoothstep (min, max, value) { return Math.max(0, Math.min(1, (value-min)/(max-min))); }

  // Game Logic


  function GfxLoader (images, dir, ext) {
    var self = this;
    var count = 0;
    var onloaded = function () {};
    dir = dir || "";
    ext = ext || "";

    var resources = {};

    for (var i = 0; i<images.length; ++i) {
      var name = images[i];
      var imgSrc = dir+name+ext;
      var img = new Image();
      img.onload = function () {
        if (++count == images.length)
          onloaded();
      }
      img.src = imgSrc;
      resources[name] = img;
    }

    self.ready = function (callback) {
      if (count==images.length)
        callback();
      else
        onloaded = callback;
    }

    self.getResource = function (name) {
      return resources[name];
    }
  }

  function Camera (world, player, width, height) {
    var self = this;
    // non normalized position
    self.x = 0;
    self.y = 0;

    self.E = BlazingRace.util.makeEvent({});

    self.getRealPosition = function (p) {
      return new b2Vec2(
        (-self.x + p.x)/DRAW_SCALE,
        (-self.y + p.y)/DRAW_SCALE
      )
    }

    self.start = function () {
    }

    self.move = function () {
      var x, y;
      var v = player.body.GetPosition();
      if (world.width > width) {
        if (v.x*DRAW_SCALE < (world.width - width/2) && v.x*DRAW_SCALE > width/2) {
          x = -(v.x*DRAW_SCALE)+(width/2);
        }
        else if(v.x*DRAW_SCALE >= (world.width-width/2)) {
          x = width-world.width;
        }
        else {
          x = 0;
        }
        self.x = x;
      }
      if(world.height > height) {
				if(v.y*DRAW_SCALE < (world.height - height/2) && v.y*DRAW_SCALE > height/2) {
					y = -(v.y*DRAW_SCALE)+(height/2);
				}
				else if(v.y*DRAW_SCALE >= (world.height - height/2)) {
					y = (height - world.height);
				}
				else {
					y = 0;
				}
        self.y = y;
			}
    }

    world.E.sub("update", function (i) {
      self.move();
    });
  }

  function MouseControls (node) {
    var self = this;
    var position = { x: 0, y: 0 };
    self.E = BlazingRace.util.makeEvent({});

    function getCanvasPosition (e) {
      var o = node.offset();
      var x = e.clientX;
      var y = e.clientY;
      return { 
        x: x-(o.left-$(window).scrollLeft()), 
        y: y-(o.top-$(window).scrollTop())
      };
    }

    node.on("mousemove", function (e) {
      e.preventDefault();
      position = getCanvasPosition(e);
      self.E.pub("move", position);
    });
    node.on("mousedown", function (e) {
      e.preventDefault();
      position = getCanvasPosition(e);
      self.E.pub("down", position);
    });
    node.on("mouseup", function (e) {
      e.preventDefault();
      position = getCanvasPosition(e);
      self.E.pub("up", position);
    });

    self.start = function () {}
  }

  function World (map) {
    var self = this;
    self.width = map.width;
    self.height = map.height;
    self.world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 10), true);

    self.grounds = [];

    self.E = BlazingRace.util.makeEvent({});

    var groundFixDef = new b2FixtureDef;
    groundFixDef.density = 1.0;
    groundFixDef.friction = 0.5;
    groundFixDef.restitution = 0.1;


    function initBounds (world, BORDER) {
      var fixDef = new b2FixtureDef;
      fixDef.density = groundFixDef.density;
      fixDef.friction = groundFixDef.friction;
      fixDef.restitution = groundFixDef.restitution;
      var bodyDef = new b2BodyDef;

      //create ground
      bodyDef.type = b2Body.b2_staticBody;
      fixDef.shape = new b2PolygonShape;
      fixDef.shape.SetAsBox(self.width / DRAW_SCALE, BORDER);

      bodyDef.position.Set(0, self.height / DRAW_SCALE);
      world.CreateBody(bodyDef).CreateFixture(fixDef);

      bodyDef.position.Set(0, 0);
      world.CreateBody(bodyDef).CreateFixture(fixDef);

      fixDef.shape.SetAsBox(BORDER, self.height / DRAW_SCALE);
      
      bodyDef.position.Set(0, 0);
      world.CreateBody(bodyDef).CreateFixture(fixDef);

      bodyDef.position.Set(self.width / DRAW_SCALE, 0);
      world.CreateBody(bodyDef).CreateFixture(fixDef);
    }

    function init (world) {
      initBounds(world, 0.01);
      var fixDef = new b2FixtureDef;
      fixDef.density = groundFixDef.density;
      fixDef.friction = groundFixDef.friction;
      fixDef.restitution = groundFixDef.restitution;
      fixDef.shape = new b2PolygonShape;
      var bodyDef = new b2BodyDef;
      bodyDef.type = b2Body.b2_staticBody;

      for (var type in map.objects) {
        var value = map.objects[type];
        if (type == "grounds") {
          for (var i = 0; i<value.length; ++i) {
            var groundRaw = value[i];
            var arr = [];
            var centerx = groundRaw[0];
            var centery = groundRaw[1];
            for (var j = 0; j<groundRaw.length/2; ++j) {
              arr[j] = new b2Vec2((groundRaw[2*j]-centerx)/DRAW_SCALE, (groundRaw[2*j+1]-centery)/DRAW_SCALE);
            }
            fixDef.shape.SetAsArray(arr, arr.length);
            bodyDef.position.Set(centerx/DRAW_SCALE, centery/DRAW_SCALE);
            var ground = world.CreateBody(bodyDef);
            ground.CreateFixture(fixDef);
            self.grounds.push(ground);
          }
        }
        if (type == "candles") {

        }
        if (type == "waters") {

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
      bodyDef.angularDamping = 0.2;
      var player = self.world.CreateBody(bodyDef);
      var fixDef = new b2FixtureDef;
      fixDef.density = 1.0;
      fixDef.friction = 0.2;
      fixDef.restitution = 0.1;
      fixDef.shape = new b2CircleShape(size);
      player.CreateFixture(fixDef);
      return player;
    }

    self.update = update;
    self.start = function () {
      init(self.world);
    }
  }

  function Player (world, _x, _y) {
    var self = this;
    self.size = 0.5;
    self.body = world.createPlayerBody(self.size, _x/DRAW_SCALE, _y/DRAW_SCALE);

    var POWER_FORCE = 12;
    var POWER_LOAD_SPEED = 4000;

    self.oxygen = 1;

    self.power = 1;
    var lastPowerUse = 0;
    var lastPowerUseRemaining = 0;

    world.E.sub("update", function (i) {
      var now = +new Date();
      if (self.power < 1) {
        self.power = clamp(0, 1, lastPowerUseRemaining+(now-lastPowerUse)/POWER_LOAD_SPEED);
      }
    });

    self.start = function () {
    }

    self.isDead = function () {
      return self.oxygen <= 0;
    }

    self.consumePower = function (intensity) {
      var powerUsage = self.power * intensity;
      self.power -= powerUsage;
      lastPowerUse = +new Date();
      lastPowerUseRemaining = self.power;
      return powerUsage * POWER_FORCE;
    }
  }

  function Game (world, player, camera, mouse) {
    var self = this;
    self.world = world;
    self.player = player;
    self.camera = camera;
    self.mouse = mouse;
    self.startTime = 0;

    var oxygen = 1;

    mouse.E.sub("down", function (canvasPosition) {
      var click = camera.getRealPosition(canvasPosition);
      var position = player.body.GetPosition();
      var force = click.Copy();
      force.Subtract(position);
      var dist = force.Normalize();
      var intensity = smoothstep(0, 5, dist);
      var power = player.consumePower(intensity);

      force.Multiply(power);
      player.body.ApplyImpulse(force, position);
    });

    function start() {
      self.startTime = +new Date();
    }

    self.start = function () {
      self.world.start();
      self.player.start();
      self.camera.start();
      self.mouse.start();
      start();
    }
  }

  // Game Render

  function GameRendering (game, node, loader) {

    var canvas = node.find("canvas.game")[0];
    var ctx = canvas.getContext("2d");

    var pe;

    function setup ()  {
      var debugDraw = new Box2D.Dynamics.b2DebugDraw();
      debugDraw.SetSprite(ctx);
      debugDraw.SetDrawScale(DRAW_SCALE);
			debugDraw.SetFillAlpha(0.5);
			debugDraw.SetLineThickness(1.0);
			debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
			game.world.world.SetDebugDraw(debugDraw);

      pe = new cParticleEmitter();
      pe.maxParticles = 250;
      pe.size = DRAW_SCALE*0.6;
      pe.sizeRandom = 10;
      pe.gravity = cParticleVector.create(-0.001, -0.02*DRAW_SCALE);
      pe.speed = 1;
      pe.speedRandom = 0.5;
      pe.sharpness = 20;
      pe.lifeSpan = 10;
      pe.lifeSpanRandom = 5;
      pe.position.x = -1000;
      pe.position.y = -1000;
		  pe.init();
    }

    var coal = loader.getResource("coal");

    function drawBackground () {
      ctx.fillStyle = 'rgb(100, 70, 50)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function fillPolygon (vertices) {
      var vertexCount = vertices.length;
      if (!vertexCount) return;
      var s = ctx;
      var drawScale = DRAW_SCALE;
      s.beginPath();
      s.moveTo(vertices[0].x * drawScale, vertices[0].y * drawScale);
      for (var i = 1; i < vertexCount; i++) {
         s.lineTo(vertices[i].x * drawScale, vertices[i].y * drawScale);
      }
      s.lineTo(vertices[0].x * drawScale, vertices[0].y * drawScale);
      s.closePath();
      s.fill();
   }

    function drawGrounds (grounds) {
      for (var i = 0; i < grounds.length; ++i) {
        var position = grounds[i].GetPosition();
         for (var fixture = grounds[i].GetFixtureList(); fixture; fixture = fixture.GetNext()) {
           ctx.fillStyle = 'rgb(0, 0, 0)';
           ctx.save();
           var shape = fixture.GetShape();
           ctx.translate(position.x*DRAW_SCALE, position.y*DRAW_SCALE);
           fillPolygon(shape.GetVertices());
           ctx.restore();
         }
      }
    }

    var lastEmit = 0;
    function drawPlayer (player) {
      if (player.isDead()) {
        pe.duration = 0;
      }
      var body = player.body;
      var p = body.GetPosition();
      ctx.save();
      ctx.translate(p.x*DRAW_SCALE, p.y*DRAW_SCALE);
      ctx.rotate(body.GetAngle());
      var playerBg = ctx.createPattern(coal, "repeat");
      ctx.fillStyle = playerBg;
      ctx.beginPath();
      ctx.arc(0, 0, player.size*DRAW_SCALE, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle="rgba(255, 100, 0, "+(Math.floor(player.oxygen*100*0.7+0.1)/100)+")";
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.arc(0, 0, player.size*DRAW_SCALE, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      var now = +new Date();
      if (now >= lastEmit + 20) {
        pe.update(1);
        lastEmit = now;
      }
      pe.position.x = p.x*DRAW_SCALE - 11;
      pe.position.y = p.y*DRAW_SCALE - 8;
      pe.renderParticles(ctx);
      
      ctx.restore();
    }

    function render () {
      var world = game.world.world;
      ctx.save();
      drawBackground();

      ctx.translate(game.camera.x, game.camera.y);

      if (DEBUG) world.DrawDebugData();

      drawGrounds(game.world.grounds);

      drawPlayer(game.player);
      ctx.restore();
    }

    var lastSeconds, lastMinutes;
    var $seconds = node.find(".chrono .seconds");
    var $minutes = node.find(".chrono .minutes");
    function DOM_render () {
      var duration = +new Date() - game.startTime;
      var seconds = Math.floor(duration / 1000) % 60;
      var minutes = Math.floor(duration / 60000) % 60;
      if (seconds != lastSeconds) {
        $seconds.text(seconds<=9 ? "0"+seconds : seconds);
        lastSeconds = seconds;
      }
      if (minutes != lastMinutes) {
        $minutes.text(minutes);
        lastMinutes = minutes;
      }
    }

    this.start = function () {
      setup();
      requestAnimFrame(function loop () {
        requestAnimFrame(loop);
        game.world.update();
        render();
      }, canvas);

      setInterval(function () {
        DOM_render();
      }, 100);
    }
  }

(function main () {

var MAP_BIG = {
  width: 2000,
  height: 1000,
  start: { x: 50, y: 100 },
  objects: {
    candles: [
      [200, 900]
    ],
    grounds: [ 
      [ 20, 130, 
        100, 130, 
        100, 150, 
        20, 150 ]
    ],
    waters: [
      
    ]
  }
}

  
  var MAP_SMALL = {
    width: 700,
    height: 500,
    start: { x: 100, y: 400 }
  }

  var MAP = MAP_BIG;

  var node = $("#game");
  var W = 800;
  var H = 600;

  var loader = new GfxLoader([
    "coal"
  ], "gfx/", ".png");
  var world = new World(MAP);
  var player = new Player(world, MAP.start.x, MAP.start.y);
  var camera = new Camera(world, player, W, H);
  var controls = new MouseControls(node);
  var game = new Game(world, player, camera, controls);
  var rendering = new GameRendering(game, node, loader);

  loader.ready(function(){
    rendering.start();
    game.start();
  });

}());

});
