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

      self.uichrono.bind(self.chrono.getTime, 1000);

      var layers = [];
      layers.push(self.world.getBackgroundRenderable());
      layers.push(self.player.getBallRenderable());
      layers.push(self.player.getFlameRenderable());
      layers.push(self.world.getMapRenderable());
      layers.push(self.world.getCandlesRenderable());
      layers.push(self.player.getCandlesIndicatorRenderable(self.world.candles));
      layers.push(self.player.getControlsRenderable());

      self.rendering.setLayers(layers);
    }

    // Destroy instance
    function destroy () {
      self.uichrono.unbind();
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
      $(window).on("resize", onWindowResize);
      onWindowResize();

      self.E.sub("started", function (i) {
        self.controls.start();
      });
      self.E.sub("stopped", function (i) {
        self.controls.stop();
      });

      self.controls.E.sub("stopped", function (){
        self.player.setCursor(null);
      });
      self.controls.E.sub("started", function (){
        self.player.setCursor({ x: 0, y: 0 });
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
