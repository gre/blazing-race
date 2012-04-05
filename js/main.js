/**
 * ~ Blazing Race ~
 * Apache Licence 2.0
 * Gaëtan Renaudeau <renaudeau.gaetan@gmail.com>
 * 2012
 */
$(function(){
  var b2Vec2 = Box2D.Common.Math.b2Vec2
  , b2Mat22 = Box2D.Common.Math.b2Mat22
  , b2AABB = Box2D.Collision.b2AABB
  , b2Math = Box2D.Common.Math.b2Math
  , b2Transform = Box2D.Common.Math.b2Transform
  ,	b2BodyDef = Box2D.Dynamics.b2BodyDef
  ,	b2Body = Box2D.Dynamics.b2Body
  ,	b2Collision = Box2D.Collision.b2Collision
  , b2Manifold = Box2D.Collision.b2Manifold
  ,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
  ,	b2Fixture = Box2D.Dynamics.b2Fixture
  ,	b2World = Box2D.Dynamics.b2World
  ,	b2MassData = Box2D.Collision.Shapes.b2MassData
  ,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
  ,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
  ,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
  , b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef
  , b2ContactListener = Box2D.Dynamics.b2ContactListener
  ;

  var isMobile = /ipad|iphone|android/i.test(navigator.userAgent);

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
    self.width = width;
    self.height = height;

    self.E = BlazingRace.util.makeEvent({});

    self.getPosition = function () {
      return new b2Vec2(self.x, self.y);
    }

    self.canvasToRealPosition = function (p) {
      return new b2Vec2(
        (-self.x + p.x)/DRAW_SCALE,
        (-self.y + p.y)/DRAW_SCALE
      )
    }

    // Return the projected point of the point o with the vector v
    // to the camera bound with a given padding.
    self.projectOnBounds = function (o, v, padding) {
      var W = self.width, H = self.height;
      o = o.Copy();
      o.Multiply(DRAW_SCALE);
      o.Add(self.getPosition());
      if (!padding) padding = 0;
      var x, y, k;

      // Try to project on left and right sides
      for (var i=0; i<=1; ++i) {
        var x = W*i;
        k = (x-o.x)/v.x;
        y = o.y + k*v.y;
        if ( k > 0 && 0 <= y && y <= H ) {
          return new b2Vec2(
            x + (!y ? padding : -padding), 
            y + (!y ? padding : -padding)
          );
        }
      }

      // Try to project on top and bottom sides
      for (var i=0; i<=1; ++i) {
        var y = H*i;
        k = (y-o.y)/v.y;
        x = o.x + k*v.x;
        if ( k > 0 && 0 <= x && x <= W ) {
          return new b2Vec2(
            x + (!x ? padding : -padding), 
            y + (!y ? padding : -padding)
          );
        }
      }
    }

    self.start = function () {
    }

    self.move = function () {
      var x, y;
      var v = player.body.GetPosition();
      if (world.width > self.width) {
        if (v.x*DRAW_SCALE < (world.width - self.width/2) && v.x*DRAW_SCALE > self.width/2) {
          x = -(v.x*DRAW_SCALE)+(self.width/2);
        }
        else if(v.x*DRAW_SCALE >= (world.width-self.width/2)) {
          x = self.width-world.width;
        }
        else {
          x = 0;
        }
        self.x = x;
      }
      if(world.height > self.height) {
				if(v.y*DRAW_SCALE < (world.height - self.height/2) && v.y*DRAW_SCALE > self.height/2) {
					y = -(v.y*DRAW_SCALE)+(self.height/2);
				}
				else if(v.y*DRAW_SCALE >= (world.height - self.height/2)) {
					y = (self.height - world.height);
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

    self.isActive = function () {
      return started;
    }

    self.start = function () {
      started = true;
      node.on("mousemove", onMouseMove);
      node.on("mousedown", onMouseDown);
    }

    self.stop = function () {
      started = false;
      node.off("mousemove", onMouseMove);
      node.off("mousedown", onMouseDown);
    }
  }

  // TODO
  var TouchControls = MouseControls;

  function World (map) {
    var self = this;
    self.map = map;
    self.width = map.width;
    self.height = map.height;
    self.world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 10), true);

    self.candles = [];

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

    function asArray (raw) {
      var arr = [];
      for (var j = 0; j<raw.length/2; ++j) {
        arr[j] = new b2Vec2((raw[2*j])/DRAW_SCALE, (raw[2*j+1])/DRAW_SCALE);
      }
      return arr;
    }

    function init (world) {
      initBounds(world, 1/DRAW_SCALE);
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
            var arr = asArray(value[i]);
            fixDef.shape.SetAsArray(arr, arr.length);
            bodyDef.position.Set(0,0);
            var water = world.CreateBody(bodyDef);
            water.SetUserData({ type: "water" });
            water.CreateFixture(fixDef);
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
  }

  function Player (world, _x, _y) {
    var self = this;
    self.size = 0.5;
    self.body = world.createPlayerBody(self.size, _x/DRAW_SCALE, _y/DRAW_SCALE);
    self.E = BlazingRace.util.makeEvent({});

    self.rez = self.body.GetPosition().Copy();

    var POWER_FORCE = 15;
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

    self.getPosition = function () {
      return self.body.GetPosition();
    }

    self.start = function () {
      self.ignition();
    }

    self.isDead = function () {
      return self.oxygen <= 0;
    }

    self.die = function () {
      self.oxygen = 0;
      self.E.pub("die");
    }

    self.ignition = function () {
      self.oxygen = 1;
      self.E.pub("live");
    }

    self.reignition = function () {
      self.oxygen = 1;
      self.body.SetPosition(self.rez);
      self.E.pub("live");
    }

    self.saveRezPoint = function () {
      self.rez = self.body.GetPosition().Copy();
    }

    self.consumePower = function (intensity) {
      var powerUsage = self.power * intensity;
      self.power -= powerUsage;
      lastPowerUse = +new Date();
      lastPowerUseRemaining = self.power;
      return powerUsage * POWER_FORCE;
    }
  }

  function Game (world, player, camera, controls) {
    var self = this;
    
    self.E = BlazingRace.util.makeEvent({});
      
    self.world = world;
    self.player = player;
    self.camera = camera;
    self.controls = controls;

    self.startTime = 0;
    self.candleCount = 0;


    self.getPlayerVector = function (p) {
      var click = camera.canvasToRealPosition(p);
      var position = player.body.GetPosition();
      var force = click.Copy();
      force.Subtract(position);
      return force;
    }

    self.MAX_DIST = 5;

    self.getIntensity = function (dist) {
      return smoothstep(0, self.MAX_DIST, dist);
    }

    controls.E.sub("usePower", function (canvasPosition) {
      var position = player.body.GetPosition();
      var force = self.getPlayerVector(canvasPosition);
      var dist = force.Normalize();
      var intensity = self.getIntensity(dist);
      var power = player.consumePower(intensity);

      force.Multiply(power);
      player.body.ApplyImpulse(force, position);
    });

    self.E.sub("lightCandle", function (candle) {
      player.saveRezPoint();
    });

    function stop() {

    }

    function start() {
      self.startTime = +new Date();
      var contactListener = new b2ContactListener;
      contactListener.BeginContact = function (contact) {
        var aData = contact.GetFixtureA().GetBody().GetUserData();
        var bData = contact.GetFixtureB().GetBody().GetUserData();
        if (aData && bData) {
          if (aData.type=="water" && bData.type=="player" && player.oxygen>0) {
            player.die();
            self.E.pub("collideWater");
          }
          else if (aData.type=="candle" && bData.type=="player") {
            if (player.oxygen && !aData.lighted) {
              aData.lighted = true;
              var candle = contact.GetFixtureA().GetBody();
              candle.SetUserData(aData);
              ++ self.candleCount;
              self.E.pub("lightCandle", { body: candle });
            }
          }
        }
      }
      self.world.world.SetContactListener(contactListener);
    }

    function won () {
      return self.candleCount >= world.map.candlesToWin;
    }

    self.checkGameState = function () {
      if (won())
        return 1;
      if (player.isDead())
        return -1;
      return 0;
    }

    self.start = function () {
      controls.start();
      start();
    }
    self.stop = function () {
      controls.stop();
      stop();
    }
  }

  // Game Render

  function GameRendering (game, W, H, node, loader) {

    var canvas = node.find("canvas.game")[0];
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext("2d");

    var pe;

    // TODO : replace with a custom texture image
    var mapTexture = $('<canvas width="'+game.world.width+'" height="'+game.world.height+'" />')[0];
    var mapTextureCtx = mapTexture.getContext("2d");
    function drawMapTexture (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      for (var i = 0; i < game.world.waters.length; ++i) {
        drawWater(game.world.waters[i], ctx);
      }
      for (var i = 0; i < game.world.grounds.length; ++i) {
        drawGround(game.world.grounds[i], ctx);
      }
    }


    function initParticles () {
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

    function setup ()  {
      if (DEBUG) {
        var debugDraw = new Box2D.Dynamics.b2DebugDraw();
        debugDraw.SetSprite(ctx);
        debugDraw.SetDrawScale(DRAW_SCALE);
        debugDraw.SetFillAlpha(0.5);
        debugDraw.SetLineThickness(1.0);
        debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
        game.world.world.SetDebugDraw(debugDraw);
      }

      initParticles();

      game.player.E.sub("die", function () {
        pe.duration = -1;
      });
      game.player.E.sub("live", function () {
        initParticles();
      });

      cacheMapTexture();
    }

    function cacheMapTexture () {
      drawMapTexture(mapTextureCtx);
    }

    var coal;

    function drawBackground (ctx) {
      ctx.fillStyle = 'rgb(100, 70, 50)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function fillPolygon (vertices, s, drawScale) {
      var vertexCount = vertices.length;
      if (!vertexCount) return;
      s.beginPath();
      s.moveTo(Math.floor(vertices[0].x * drawScale), Math.floor(vertices[0].y * drawScale));
      for (var i = 1; i < vertexCount; i++) {
         s.lineTo(
             Math.floor(vertices[i].x * drawScale), 
             Math.floor(vertices[i].y * drawScale)
         );
      }
      s.lineTo(
        Math.floor(vertices[0].x * drawScale), 
        Math.floor(vertices[0].y * drawScale)
      );
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
      var waters = game.world.map.objects.waters;
      ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
      for (var i = 0; i < waters.length; ++i) {
        fillPolygon(rawToPositions(waters[i]), ctx, 1);
      }

      var grounds = game.world.map.objects.grounds;
      ctx.fillStyle = 'rgb(0, 0, 0)';
      for (var i = 0; i < grounds.length; ++i) {
        fillPolygon(rawToPositions(grounds[i]), ctx, 1);
      }
    }

    function copyMapTexture (ctx) {
      ctx.drawImage(mapTexture, 0, 0);
    }

    var candleOn, candleOff, CANDLE_W = 30, CANDLE_H = 30;

    function drawCandleIndicator (candle) {
      var playerPosition = game.player.getPosition();
      var v = candle.GetPosition().Copy();
      v.Subtract(playerPosition);
      var dist = v.Normalize();
      var mindist = new b2Vec2(game.world.width, game.world.height).Normalize()/DRAW_SCALE;
      var size = 30*(1-1.5*smoothstep(0, mindist, dist));

      if (size > 0) {
        var p = game.camera.projectOnBounds(playerPosition, v, size+5);
        p.Subtract(game.camera.getPosition());

        ctx.save();
        ctx.translate(p.x, p.y);

        ctx.rotate(Math.atan2(v.y, v.x));

        ctx.fillStyle = 'rgba(240, 210, 100, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, -size/4);
        ctx.lineTo(0, size/4);
        ctx.lineTo(size, 0);
        ctx.fill();

        ctx.restore();
      }
    }

    function drawCandle (candle) {
      var position = candle.GetPosition();
      var fixture = candle.GetFixtureList();
      var lighted = fixture.GetBody().GetUserData().lighted;
      var x = position.x * DRAW_SCALE;
      var y = position.y * DRAW_SCALE;
      var w = ctx.canvas.width;
      var h = ctx.canvas.height;

      var ax = x + game.camera.x;
      var ay = y + game.camera.y;

      var visible = (function (x, y) {
        return -CANDLE_W/2 < x && x < w+CANDLE_W/2 && -CANDLE_H/2 < y && y < h+CANDLE_H/2;
      }(ax, ay));

      if (!visible && !lighted) {
        drawCandleIndicator(candle);
      }

      if (visible) {
        ctx.save();
        ctx.translate(x, y);
        if (lighted) {
          ctx.fillStyle = 'rgb(255, 200, 150)';
          ctx.drawImage(candleOn, -CANDLE_W/2, -CANDLE_W/2-(CANDLE_H-CANDLE_W), CANDLE_W, CANDLE_H);
        }
        else {
          ctx.fillStyle = 'rgb(200, 170, 160)';
          ctx.drawImage(candleOff, -CANDLE_W/2, -CANDLE_W/2-(CANDLE_H-CANDLE_W), CANDLE_W, CANDLE_H);
        }
        ctx.restore();
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

      // flame particle
      // TODO : clip to space around
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      var now = +new Date();
      if (now >= lastEmit + 20) {
        pe.update(Math.min(1/game.player.power, 10));
        lastEmit = now;
      }
      pe.position.x = p.x*DRAW_SCALE - 11;
      pe.position.y = p.y*DRAW_SCALE - 8;
      pe.renderParticles(ctx);
      
      ctx.restore();
    }

    var POWER_CIRCLE_OPEN = 0.05 * Math.PI;
    var POWER_CURSOR_SIZE = 10;
    var POWER_CIRCLE_LINEWIDTH = 5;
    var POWER_CIRCLE_COLOR = 'rgba(100,80,60,0.5)';
    function drawPowerCircle (controls) {
      var pos = game.player.body.GetPosition();
      var mouseP = controls.getCursorPosition && controls.getCursorPosition();
      var power = game.player.power;
      var powerDist = power * game.MAX_DIST;
      var p, dist, intensity;
      var fromAngle, toAngle;

      if (mouseP) {
        p = game.getPlayerVector(mouseP);
        dist = p.Normalize();
        intensity = Math.min(game.getIntensity(dist), game.player.power);
        fromAngle = Math.atan2(p.y, p.x) + POWER_CIRCLE_OPEN/2;
        toAngle = fromAngle + 2*Math.PI - POWER_CIRCLE_OPEN;
      }
      else {
        intensity = power;
        fromAngle = 0;
        toAngle = 2*Math.PI;
      }
      var intensityDist = intensity * game.MAX_DIST;

      ctx.save();
      ctx.strokeStyle = POWER_CIRCLE_COLOR;
      ctx.fillStyle = POWER_CIRCLE_COLOR;
      ctx.translate(pos.x*DRAW_SCALE, pos.y*DRAW_SCALE);
      ctx.beginPath();
      ctx.lineWidth = intensity * POWER_CIRCLE_LINEWIDTH;
      ctx.arc(0, 0, intensityDist*DRAW_SCALE, fromAngle, toAngle);
      ctx.stroke();

      if (p) {
        ctx.beginPath();
        ctx.arc(intensityDist*p.x*DRAW_SCALE, intensityDist*p.y*DRAW_SCALE, intensity*POWER_CURSOR_SIZE, 0, 2*Math.PI);
        ctx.fill();
      }

      ctx.restore();
    }

    function render () {
      var world = game.world.world;
      ctx.save();

      drawBackground(ctx);

      ctx.translate(game.camera.x, game.camera.y);

      if (DEBUG) world.DrawDebugData();

      copyMapTexture(ctx);

      for (var i = 0; i < game.world.candles.length; ++i) {
        drawCandle(game.world.candles[i]);
      }

      if (game.controls.isActive())
        drawPowerCircle(game.controls);
      drawPlayer(game.player);

      ctx.restore();
    }

    var lastSeconds, lastMinutes;
    var $seconds = node.find(".chrono .seconds");
    var $minutes = node.find(".chrono .minutes");
    var countdownTime = +new Date();
    var countdownRunning = false;
    var ended = false;
    var COUNTDOWN_DURATION = 3000;
    function DOM_render () {
      if (ended) return;
      var duration = +new Date() - countdownTime - COUNTDOWN_DURATION;
      if (duration < 0) {
        if (!countdownRunning) {
          countdownRunning = true;
        }
        countdown( -duration );
      }
      else {
        if (countdownRunning) {
          if (game.checkGameState() == -1) {
            game.player.reignition();
          }
          countdown(-1);  
          game.start();
          countdownRunning = false;
        }
        duration = +new Date() - game.startTime;
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

        var state = game.checkGameState();
        if (state) {
          if (state>0) {
            ended = true;
            win();
          }
          else {
            neverDead = false;
            lose();
          }
        }
      }
    }

    var $end = node.find(".front");

    var currentCount = null;
    function countdown(ms) {
      var seconds = Math.ceil(ms/1000);
      if (seconds === currentCount) {
        return;
      }
      currentCount = seconds;
      if (seconds>0) {
        $end.fadeIn();
        $end.find(".countdown").remove();
        $end.append('<div class="countdown">'+seconds+'</div>');
        setTimeout(function(){
          $end.find(".countdown").addClass("change");
        }, 100);
      }
      else if (seconds<=0) {
        $end.find(".message").empty();
        $end.find(".countdown").empty();
        $end.hide();
      }
    }

    function win() {
      $end.fadeIn().find(".message").text("All candles are lighted! You succeed!");
      game.stop();
    }

    function lose() {
      game.stop();
      setTimeout(function(){
        $end.fadeIn().find(".message").text("Reignition...");
        countdownTime = +new Date();
      }, 500);
    }

    this.start = function () {
      coal = loader.getResource("coal");
      candleOn = loader.getResource("candle-on");
      candleOff = loader.getResource("candle-off");
      CANDLE_H = Math.floor(CANDLE_W * candleOn.height/candleOn.width);

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
  width: 3000,
  height: 2250,
  start: { x: 125, y: 485 },
  candlesToWin: 2,
  objects: {
    candles: [
      //[100, 380],
      [110, 850],
      [1000, 2150]
    ],
    grounds: [ 
     [ 0, 410, 200, 410, 210, 430, 0, 430 ]
    ,[ 70, 530, 210, 530, 210, 555, 70, 555 ]
    ,[ 200, 410, 560, 270, 580, 640, 420, 710, 210, 555 ]
    ,[ 0, 670, 190, 660, 320, 850, 220, 850, 0, 690 ]
    ,[ 320, 850, 520, 1120, 300, 1140, 220, 850 ]
    ,[ 0, 940, 230, 1260, 215, 1325, 0, 1070 ]
    ,[ 230, 1260, 570, 1260, 600, 1320, 215, 1325 ]
    ,[ 420, 710, 580, 640, 660, 710, 1060, 1750, 930, 1800 ]
    ,[ 130, 1430, 750, 1400, 800, 1470, 150, 1500 ]
    ,[ 300, 1450, 350, 1450, 370, 1900, 300, 1900 ]
    ,[ 350, 1850, 450, 1850, 450, 1900, 350, 1900 ]
    ,[ 0, 1900, 150, 1900, 150, 1910, 0, 1910 ]
    ,[ 120, 2000, 320, 2000, 320, 2010, 120, 2010 ]
    ,[ 430, 2070, 1020, 2150, 1020, 2250, 450, 2250 ]
    ,[ 450, 1570, 560, 1540, 570, 1600, 450, 1600 ]
    ,[ 520, 2100, 520, 1600, 570, 1600, 620, 2110 ]
    ,[ 630, 1620, 750, 1600, 800, 1700, 750, 1700, 630, 1660 ] 
    ,[ 750, 1700, 800, 1700, 900, 1850, 750, 1820 ]
    ,[ 580, 1750, 770, 1740, 780, 1824, 590, 1800 ]
    ,[ 930, 1800, 1060, 1750, 1000, 2000, 980, 2020 ]
    ,[ 700, 1920, 970, 1900, 980, 2020, 700, 2020 ]


    // TODO
    ],
    waters: [
      [0, 2150, 450, 2150, 450, 2250, 0, 2250]
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
  var W = node.width();
  var H = node.height();

  var loader = new GfxLoader([
    "coal",
    "candle-off",
    "candle-on"
  ], "gfx/", ".png");
  var world = new World(MAP);
  var player = new Player(world, MAP.start.x, MAP.start.y);
  var camera = new Camera(world, player, W, H);
  var controls;
  if (isMobile) {
    controls = new TouchControls(node);
  }
  else {
    controls = new MouseControls(node);
  }
  var game = new Game(world, player, camera, controls);
  var rendering = new GameRendering(game, W, H, node, loader);

  loader.ready(function(){
    world.start();
    player.start();
    camera.start();
    rendering.start();
  });

  BlazingRace.game = game;

}());

});
