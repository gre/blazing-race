(function(ns){

  var GameRecorder = BlazingRace.GameRecorder
  , Player = BlazingRace.Player
  , World = BlazingRace.World 
  , Camera = BlazingRace.Camera 
  , MouseControls = BlazingRace.MouseControls 
  , TouchControls = BlazingRace.TouchControls 
  , Renderer = BlazingRace.Renderer
  , Interface = BlazingRace.Interface
  , Chrono = BlazingRace.Chrono
  ;

  var makeEvent = BlazingRace.util.makeEvent
  ;

  var b2Vec2 = Box2D.Common.Math.b2Vec2
  ;

  var isMobile = /ipad|iphone|android/i.test(navigator.userAgent);

  ns.TimeTrialGame = function (node, map, loader) {
    var self = this;
    
    self.map = map;
    self.loader = loader;

    self.E = makeEvent({});

    var gameRunning = false;

    // Create game components instance
    function init () {
      self.world = new World(map);
      self.controls = isMobile ? new TouchControls(node) 
                              : new MouseControls(node);
      self.camera = new Camera(true);
      self.rendering = new Renderer(node.find("canvas.game")[0]);
      self.recorder = new GameRecorder(self);
      self.player = new Player(self.world, map.data.start[0].x, map.data.start[0].y);
      self.camera.setWorldSize(self.world.width, self.world.height);

      self.ui = new Interface(node);
      self.uichrono = self.ui.chrono();
      self.message = self.ui.message();
      self.chrono = new Chrono();
    }

    // Destroy instance
    function destroy () {
      // ... TODO
    }

    // Start the game
    function start () {
      self.world.start();
      self.player.start();
      self.rendering.start(self.camera, self.loader);

      self.message.countdownStart(3, "Ready?", function () {
        gameRunning = true;
        self.chrono.start();
        self.E.pub("started");
      });
    }

    // Stop the game (pause?)
    function stop () {
      self.chrono.stop();
      self.world.stop();
      self.player.stop();
      self.rendering.stop();
      gameRunning = false;
      self.E.pub("stopped");
    }

    // STATIC FUNCTIONS

    function won () {
      return self.player.candleCount >= self.world.map.candles.length;
    }

    // BINDING
    
    var lastWidth, lastHeight;
    function onWindowResize () {
      var w = Math.max(250, Math.floor($(window).width()));
      var h = Math.max(200, Math.floor($(window).height()));
      if (w !== lastWidth || h !== lastHeight) {
        node.width(w).height(h);
        self.camera.resize(w, h);
        self.rendering.resize(w, h);
      }
    }

    // Bind the components together
    function bind () {
      self.uichrono.bind(self.chrono.getTime, 1000);

      self.rendering.addLayer(self.world.getBackgroundRenderable());
      self.rendering.addLayer(self.player.getBallRenderable());
      self.rendering.addLayer(self.player.getFlameRenderable());
      self.rendering.addLayer(self.world.getMapRenderable());
      self.rendering.addLayer(self.world.getCandlesRenderable());
      self.rendering.addLayer(self.player.getCandlesIndicatorRenderable(self.world.candles));
      self.rendering.addLayer(self.player.getLightingRenderable());

      $(window).on("resize", onWindowResize);
      onWindowResize();

      self.E.sub("started", function (i) {
        self.controls.start();
      });
      self.E.sub("stopped", function (i) {
        self.controls.stop();
      });

      var controlsRenderable = null;
      self.controls.E.sub("stopped", function (){
        controlsRenderable && self.rendering.removeLayer(controlsRenderable);
      });
      self.controls.E.sub("started", function (){
        controlsRenderable && self.rendering.removeLayer(controlsRenderable);
        self.rendering.addLayer(controlsRenderable = self.player.getControlsRenderable());
      });

      self.controls.E.sub("position", function (position) {
        self.player.setCursor(position); 
      });

      self.controls.E.sub("usePower", function (canvasPosition) {
        self.player.usePower( self.player.getVector(self.camera.canvasToRealPosition(canvasPosition)) );
      });

      self.player.E.sub("live", function (i) {
        gameRunning && self.controls.start();
      });
      self.player.E.sub("die", function (i) {
        self.controls.stop();
        self.message.countdownStart(3, "Reignition...", function () {
          self.player.reignition();
        });
      });
      self.player.E.sub("lightCandle", function () {
        if (won()) {
          self.message.setMessage("Congratulations!", "All candles have been lighted!").show();
          stop();
        }
      });

      self.world.E.sub("update", function (i) {
        self.camera.focusOn(self.player.getPosition());
      });
    }

    // Unbind the components
    function unbind () {
      self.uichrono.unbind();
      // TODO
    }

    self.start = function () {
      init();
      bind();
      start();
    }
    self.stop = function () {
      stop();
      unbind();
      destroy();
    }
  }

}(window.BlazingRace));
