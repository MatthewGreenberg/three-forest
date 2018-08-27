const { gui, webgl, assets } = require('../../context');

const LiveShaderMaterial = require('../materials/LiveShaderMaterial');
const honeyShader = require('../shaders/honey.shader');
const animate = require('@jam3/gsap-promise');
const Cloud = require('./Cloud');
const Cloud2 = require('./Cloud2');
const Cloud3 = require('./Cloud3');
const Cloud4 = require('./Cloud4');

module.exports = class Clouds extends THREE.Object3D {
  constructor() {
    super();
    this.clouds = new THREE.Group();
    this.clouds.scale.set(10, 10, 10);
    this.clouds.position.y = 100;

    this.add(this.clouds);
  }

  createClouds() {
    const clouds = [new Cloud(), new Cloud2(), new Cloud3(), new Cloud4()];
    clouds.forEach(cloud => {
      cloud.position.x = (Math.random() - 0.5) * 30;
      cloud.position.z = (Math.random() - 0.5) * 30;
      cloud.position.y = (Math.random() - 0.5) * 3;
      cloud.castShadow = true;
      this.clouds.add(cloud);
    });
  }

  onAppDidUpdate(oldProps, oldState, newProps, newState) {
    if (newState.isLoaded && newState.isLoaded !== oldState.isLoaded) {
      this.createClouds();
    }
  }

  animateIn() {
    animate.from(this.clouds.position, 2.0, {
      y: 1,
      ease: Back.easeOut
    });
  }

  moveCloud(hits) {
    animate
      .to(hits[0].object.position, 0.75, {
        z: -3,
        ease: Power2.easeOut
      })
      .then(() => {
        animate.to(hits[0].object.position, 0.75, {
          z: 0,
          ease: Power2.easeOut
        });
      });
  }

  onTouchStart(ev, pos) {
    const [x, y] = pos;
    console.log('Touchstart / mousedown: (%d, %d)', x, y);

    // For example, raycasting is easy:
    const coords = new THREE.Vector2().set(
      (pos[0] / webgl.width) * 2 - 1,
      (-pos[1] / webgl.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coords, webgl.camera);
    const hits = raycaster.intersectObject(this, true);
    console.log(hits.length > 0 ? `Hit ${hits[0].object.name}!` : 'No hit');
    if (hits.length > 0) {
      this.moveCloud(hits);
    }
  }
};
