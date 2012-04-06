(function(ns){

  var makeEvent = BlazingRace.util.makeEvent
  , clamp = BlazingRace.util.clamp
  , smoothstep = BlazingRace.util.smoothstep
  ;


  ns.Player = function (game, _x, _y, _controls, _camera) {
    var world = game.world;
    var self = this;
    self.size = 0.5;
    self.body = world.createPlayerBody(self.size, _x/DRAW_SCALE, _y/DRAW_SCALE);
    self.E = makeEvent({});

    self.controls = _controls;
    self.camera = _camera;

    self.rez = self.body.GetPosition().Copy();

    var POWER_FORCE = 15;
    var POWER_LOAD_SPEED = 4000;

    self.oxygen = 1;

    self.power = 1;
    var lastPowerUse = 0;
    var lastPowerUseRemaining = 0;

    self.MAX_DIST = 5;
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

    self.onContact = function (contact) {

    }

    self.reignition = function () {
      self.body.SetPosition(self.rez);
      self.ignition();
    }

    self.ignition = function () {
      initParticles();
      self.oxygen = 1;
      self.E.pub("live");
    }

    self.die = function () {
      self.oxygen = 0;
      pe.duration = -1;
      self.E.pub("die");
    }

    var pe;
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

    // RENDERING
    var coal;

    function drawPlayer (ctx) {
      if (self.isDead()) {
        pe.duration = 0;
      }
      var p = self.getPosition();
      ctx.save();
      ctx.translate(p.x*DRAW_SCALE, p.y*DRAW_SCALE);
      ctx.rotate(self.body.GetAngle());
      var playerBg = ctx.createPattern(coal, "repeat");
      ctx.fillStyle = playerBg;
      ctx.beginPath();
      ctx.arc(0, 0, self.size*DRAW_SCALE, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle="rgba(255, 100, 0, "+(Math.floor(self.oxygen*100*0.7+0.1)/100)+")";
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.arc(0, 0, self.size*DRAW_SCALE, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    var lastEmit = 0;
    // TODO : clip to space around
    function drawFlame (ctx) {
      var p = self.getPosition();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      var now = +new Date();
      if (now >= lastEmit + 20) {
        pe.update(Math.min(1/self.power, 10));
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
    var POWER_CIRCLE_COLOR = 'rgba(150,130,60,0.5)';
    function drawPowerCircle (ctx) {
      var pos = self.getPosition();
      var mouseP = self.controls.getCursorPosition && self.controls.getCursorPosition();
      var power = self.power;
      var powerDist = power * self.MAX_DIST;
      var p, dist, intensity;
      var fromAngle, toAngle;

      if (mouseP) {
        p = self.getVector(self.camera.canvasToRealPosition(mouseP));
        dist = p.Normalize();
        intensity = Math.min(self.getIntensity(dist), self.power);
        fromAngle = Math.atan2(p.y, p.x) + POWER_CIRCLE_OPEN/2;
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

    self.setup = function (loader) {
      coal = loader.getResource("coal");
    }

    self.render = function (ctx) {
      if (self.controls.isActive())
        drawPowerCircle(ctx);
      drawPlayer(ctx);
      drawFlame(ctx);
    }
  }

}(window.BlazingRace));
