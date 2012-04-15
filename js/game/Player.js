(function(ns){

  var makeEvent = BlazingRace.util.makeEvent
  , clamp = BlazingRace.util.clamp
  , smoothstep = BlazingRace.util.smoothstep
  ,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
  ,	b2BodyDef = Box2D.Dynamics.b2BodyDef
  ,	b2Body = Box2D.Dynamics.b2Body
  ,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
  ;

  ns.Player = function (game, _x, _y, _controls, _camera) {
    var world = game.world;
    var self = this;
    self.size = 0.5;
    self.body = createPlayerBody(self.size, _x, _y);

    self.candleCount = 0;

    self.E = makeEvent({});

    self.controls = _controls;
    self.camera = _camera;
    self.oxygen = 1;
    self.power = 1;

    self.rez = self.body.GetPosition().Copy();
    self.MAX_DIST = 5;

    world.bindCollision(self.body, "candle", function (playerBody, candleBody, playerData, candleData) {
      if (self.oxygen>0 && !candleData.lighted) {
        candleData.lighted = true;
        candleBody.SetUserData(candleData);
        ++ self.candleCount;
        self.saveRezPoint();
        self.E.pub("lightCandle", { body: candleBody, data: candleData });
      }
    });

    world.bindFluids(self.body, function () { 
      self.oxygen>0 && self.die();
    });

    function createPlayerBody (size, x, y) {
      var bodyDef = new b2BodyDef;
      bodyDef.type = b2Body.b2_dynamicBody;
      bodyDef.position.x = x;
      bodyDef.position.y = y;
      //bodyDef.angularDamping = 0.2;
      var player = world.world.CreateBody(bodyDef);
      var fixDef = new b2FixtureDef;
      fixDef.density = 1.0;
      fixDef.friction = 0.2;
      fixDef.restitution = 0.2;
      fixDef.shape = new b2CircleShape(size);
      player.CreateFixture(fixDef);
      player.SetUserData({ type: "player" });
      return player;
    }

    var POWER_FORCE = 15;
    var POWER_LOAD_SPEED = 3000;

    var lastPowerUse = 0;
    var lastPowerUseRemaining = 0;

    self.getIntensity = function (dist) {
      return smoothstep(0, self.MAX_DIST, dist);
    }

    world.E.sub("update", function (i) {
      var now = +new Date();
      if (self.power < 1) {
        self.power = clamp(0, 1, lastPowerUseRemaining+(now-lastPowerUse)/POWER_LOAD_SPEED);
      }
    });

    self.controls.E.sub("usePower", function (canvasPosition) {
      var position = self.body.GetPosition();
      var force = self.getVector(self.camera.canvasToRealPosition(canvasPosition));
      var dist = force.Normalize();
      var intensity = self.getIntensity(dist);
      var power = self.consumePower(intensity);

      force.Multiply(power);
      self.body.ApplyImpulse(force, position);
    });

    self.getVector = function (point) {
      var position = self.body.GetPosition();
      var force = point.Copy();
      force.Subtract(position);
      return force;
    }

    self.getPosition = function () {
      return self.body.GetPosition();
    }

    self.start = function () {
      self.ignition();
    }

    self.isDead = function () {
      return self.oxygen <= 0;
    }

    self.saveRezPoint = function () {
      self.rez = self.getPosition().Copy();
    }

    self.consumePower = function (intensity) {
      var powerUsage = self.power * intensity;
      self.power -= powerUsage;
      lastPowerUse = +new Date();
      lastPowerUseRemaining = self.power;
      return powerUsage * POWER_FORCE;
    }

    self.reignition = function () {
      self.body.SetPosition(self.rez);
      self.ignition();
    }

    self.ignition = function () {
      self.oxygen = 1;

      initParticles();
      self.E.pub("live");
    }

    self.die = function () {
      self.oxygen = 0;
      pe.stopParticleEmitter();
      self.E.pub("die");
    }


    // RENDERING
    var PARTICLE_SIZE = 1.1

    function getPeSize (camera) {
      return PARTICLE_SIZE * camera.scale;
    }

    var pe;
    function initParticles (camera) {
      pe && pe.stopParticleEmitter();
      pe = new cParticleEmitter();
      pe.maxParticles = 60;
      pe.lifeSpan = 9;
      pe.lifeSpanRandom = 1;
      pe.position.x = -1000;
      pe.position.y = -1000;
	    pe.startColour = [ 240, 208, 68, 1 ];
	    pe.startColourRandom = [ 40, 40, 60, 0 ];
	    pe.finishColour = [ 245, 35, 0, 0 ];  
	    pe.finishColourRandom = [ 20, 20, 20, 0 ];
      if (camera) {
        pe.gravity = { x: 0, y: -0.03*camera.scale };
        pe.size = getPeSize(camera);
        pe.sizeRandom = 0.4*camera.scale;
        pe.speed = 0.01*camera.scale;
        pe.speedRandom = 0.005*camera.scale;
        pe.sharpness = .3*camera.scale;
        pe.sharpnessRandom = .1*camera.scale;
        pe.positionRandom = { x: 0.*camera.scale, y: 0.*camera.scale };
      }
		  pe.init();
    }
  
    var lastEmit = 0;
    function drawFlame (ctx, camera) {
      ctx.save();
      var p = self.getPosition();
      ctx.globalCompositeOperation = "lighter";

      if (pe.size != getPeSize(camera)) {
        initParticles(camera);
      }
      var now = +new Date();
      if (now >= lastEmit + 25) {
        pe.lifeSpan = Math.round(1+self.power*8);
        pe.update(1);
        lastEmit = now;
      }
      p = camera.realPositionToCanvas(p);
      pe.position.x = p.x-0.65*camera.scale-camera.x;
      pe.position.y = p.y-0.55*camera.scale+camera.y;
      ctx.translate(camera.x, -camera.y);
      pe.renderParticles(ctx);
      ctx.restore();
    }


    var coalImg;
    var coal = $('<canvas></canvas>').appendTo("body")[0], 
    coalCtx = coal.getContext("2d");

    function generateCoal (camera) {
      var x, y;
      coal.width = 2* self.size * camera.scale;
      coal.height = 2* self.size * camera.scale;
      coalCtx.drawImage(coalImg,
          0, 0, coalImg.width, coalImg.height,
          0, 0, coal.width, coal.height);
    }

    var lastScaleCoal;
    function generateCoalIfChanged (camera) {
      if (camera.scale !== lastScaleCoal) {
        lastScaleCoal = camera.scale;
        generateCoal(camera);
      }
    }

    function drawPlayer (ctx, camera) {
      generateCoalIfChanged(camera);
      ctx.save();
      var p = camera.realPositionToCanvas(self.getPosition());
      ctx.translate(p.x, p.y);
      ctx.rotate(-self.body.GetAngle());
      ctx.drawImage(coal, Math.round(-coal.width/2), Math.round(-coal.height/2));
      ctx.fillStyle="rgba(255, 100, 0, "+(Math.floor(self.oxygen*100*0.5+0.1)/100)+")";
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.arc(0, 0, self.size*camera.scale, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    
    var POWER_CIRCLE_OPEN = 0.05 * Math.PI;
    var POWER_CURSOR_SIZE = 0.25;
    var POWER_CIRCLE_LINEWIDTH = 0.1;
    var POWER_CIRCLE_COLOR = 'rgba(220,200,150,0.5)';
    function drawPowerCircle (ctx, camera) {
      //var pos = self.getPosition();
      var pos = camera.realPositionToCanvas(self.getPosition());
      var mouseP = self.controls.getCursorPosition && self.controls.getCursorPosition();
      var power = self.power;
      var powerDist = power * self.MAX_DIST;
      var p, dist, intensity;
      var fromAngle, toAngle;

      if (mouseP) {
        p = self.getVector(self.camera.canvasToRealPosition(mouseP));
        dist = p.Normalize();
        intensity = Math.min(self.getIntensity(dist), self.power);
        fromAngle = Math.atan2(-p.y, p.x) + POWER_CIRCLE_OPEN/2;
        toAngle = fromAngle + 2*Math.PI - POWER_CIRCLE_OPEN;
      }
      else {
        intensity = power;
        fromAngle = 0;
        toAngle = 2*Math.PI;
      }
      var intensityDist = intensity * self.MAX_DIST;

      ctx.save();
      ctx.strokeStyle = POWER_CIRCLE_COLOR;
      ctx.fillStyle = POWER_CIRCLE_COLOR;
      ctx.translate(pos.x, pos.y);
      ctx.beginPath();
      ctx.lineWidth = power * POWER_CIRCLE_LINEWIDTH * camera.scale;
      ctx.arc(0, 0, powerDist*camera.scale, fromAngle, toAngle);
      ctx.stroke();

      if (p) {
        ctx.beginPath();
        ctx.arc(intensityDist*p.x*camera.scale, -intensityDist*p.y*camera.scale, intensity*POWER_CURSOR_SIZE*camera.scale, 0, 2*Math.PI);
        ctx.fill();
      }

      ctx.restore();
    }

    self.setup = function (loader) {
      coalImg = loader.getResource("coal");
    }

    self.renderControls = function (ctx, camera) {
      if (self.controls.isActive())
        drawPowerCircle(ctx, camera);
    }
    self.renderBall = drawPlayer;
    self.renderFlame = drawFlame;
  }

}(window.BlazingRace));
