const { EventEmitter } = require('events');
const assign = require('object-assign');
const THREE = require('three');
const defined = require('defined');
const rightNow = require('right-now');
const TrackballControls = require('three-trackballcontrols');
const createOrbitControls = require('orbit-controls');
const createTouches = require('touches');

module.exports = class WebGLApp extends EventEmitter {
  constructor(opt = {}) {
    super();

    this.renderer = new THREE.WebGLRenderer(
      assign(
        {
          antialias: true,
          alpha: false,
          // enabled for saving screen shots of the canvas,
          // may wish to disable this for perf reasons
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: true
        },
        opt
      )
    );

    this.renderer.sortObjects = false;
    this.renderer.shadowMap.enabled = true;
    this.canvas = this.renderer.domElement;

    // really basic touch handler that propagates through the scene
    this.touchHandler = createTouches(this.canvas, {
      target: this.canvas,
      filtered: true
    });
    this.touchHandler.on('start', (ev, pos) =>
      this._traverse('onTouchStart', ev, pos)
    );
    this.touchHandler.on('end', (ev, pos) =>
      this._traverse('onTouchEnd', ev, pos)
    );
    this.touchHandler.on('move', (ev, pos) =>
      this._traverse('onTouchMove', ev, pos)
    );

    // default background color
    const background = defined(opt.background, '#000');
    const backgroundAlpha = defined(opt.backgroundAlpha, 1);
    this.renderer.setClearColor(0xffffff, backgroundAlpha);

    // clamp pixel ratio for performance
    this.maxPixelRatio = defined(opt.maxPixelRatio, 2);

    // clamp delta to stepping anything too far forward
    this.maxDeltaTime = defined(opt.maxDeltaTime, 1 / 30);

    // setup a basic camera
    const fov = defined(opt.fov, 120);
    const near = defined(opt.near, 0.01);
    const far = defined(opt.far, 100);
    var ww = window.innerWidth,
      wh = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, ww / wh, 0.1, 1000);
    this.controls = new TrackballControls(this.camera);
    this.camera.position.x = -220;
    this.camera.position.y = 150;
    this.camera.position.z = 220;

    this.controls.autoRotate = true;

    this.time = 0;
    this._running = false;
    this._lastTime = rightNow();
    this._rafID = null;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xefd1b5, 0.0025);
    // add light
    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    this.scene.add(light);
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.y = 120;
    spotLight.position.x = -320;
    spotLight.castShadow = true;
    spotLight.lookAt(new THREE.Vector3());
    this.scene.add(spotLight);
    spotLight.shadow.mapSize.width = 4096;
    spotLight.shadow.mapSize.height = 4096;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 1000;
    var hemisphereLight = new THREE.HemisphereLight(0xeeeeee, 0x080820, 1);
    this.scene.add(hemisphereLight);
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => this.resize());

    // force an initial resize event
    this.resize();
  }

  get running() {
    return this._running;
  }

  animateIn(opt = {}) {
    this._traverse('animateIn', opt);
  }

  onAppDidUpdate(oldProps, oldState, newProps, newState) {
    this._traverse('onAppDidUpdate', oldProps, oldState, newProps, newState);
  }

  resize(width, height, pixelRatio) {
    // get default values
    width = defined(width, window.innerWidth);
    height = defined(height, window.innerHeight);
    pixelRatio = defined(
      pixelRatio,
      Math.min(this.maxPixelRatio, window.devicePixelRatio)
    );

    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;

    // update pixel ratio if necessary
    if (this.renderer.getPixelRatio() !== pixelRatio) {
      this.renderer.setPixelRatio(pixelRatio);
    }

    // setup new size & update camera aspect if necessary
    this.renderer.setSize(width, height);
    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = width / height;
    }
    this.camera.updateProjectionMatrix();

    // draw a frame to ensure the new size has been registered visually
    this.draw();
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    this.camera.aspect = ww / wh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(ww, wh);
    return this;
  }

  // convenience function to trigger a PNG download of the canvas
  saveScreenshot(opt = {}) {
    // force a specific output size
    this.resize(defined(opt.width, 2560), defined(opt.height, 1440), 1, true);
    this.draw();

    const dataURI = this.canvas.toDataURL('image/png');

    // reset to default size
    this.resize();
    this.draw();

    // save
    const file = defined(opt.fileName, defaultFile('.png'));
    saveDataURI(file, dataURI);
  }

  update(dt = 0, time = 0) {
    this.controls.update();

    // recursively tell all child objects to update
    this.scene.traverse(obj => {
      if (typeof obj.update === 'function') {
        obj.update(dt, time);
      }
    });

    return this;
  }

  draw() {
    this.renderer.render(this.scene, this.camera);
    return this;
  }

  start() {
    if (this._rafID !== null) return;
    this._rafID = window.requestAnimationFrame(this.animate);
    this._running = true;
    return this;
  }

  stop() {
    if (this._rafID === null) return;
    window.cancelAnimationFrame(this._rafID);
    this._rafID = null;
    this._running = false;
    return this;
  }

  animate = () => {
    // <-- Note: using class functions thanks to a Babel plugin
    if (!this.running) return;
    window.requestAnimationFrame(this.animate);

    const now = rightNow();
    const dt = Math.min(this.maxDeltaTime, (now - this._lastTime) / 1000);
    this.time += dt;
    this._lastTime = now;
    this.update(dt, this.time);
    this.draw();
  };

  _traverse = (fn, ...args) => {
    this.scene.traverse(child => {
      if (typeof child[fn] === 'function') {
        child[fn].apply(child, args);
      }
    });
  };
};

function dataURIToBlob(dataURI) {
  const binStr = window.atob(dataURI.split(',')[1]);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new window.Blob([arr]);
}

function saveDataURI(name, dataURI) {
  const blob = dataURIToBlob(dataURI);

  // force download
  const link = document.createElement('a');
  link.download = name;
  link.href = window.URL.createObjectURL(blob);
  link.onclick = () => {
    process.nextTick(() => {
      window.URL.revokeObjectURL(blob);
      link.removeAttribute('href');
    });
  };
  link.click();
}

function defaultFile(ext) {
  const str = `${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}${ext}`;
  return str.replace(/\//g, '-').replace(/:/g, '.');
}
