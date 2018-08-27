const animate = require('@jam3/gsap-promise');
const { webgl } = require('../../context');
module.exports = class Ground extends THREE.Object3D {
  constructor() {
    super();
    var groundGeom = new THREE.PlaneBufferGeometry(400, 400);
    var matrixRotation = new THREE.Matrix4();
    matrixRotation.makeRotationX(Math.PI * -0.5);
    groundGeom.applyMatrix(matrixRotation);
    var groundMat = new THREE.MeshPhongMaterial({
      color: 0x3399ff,
      shininess: 0,
      name: 'ground',
    });
    this.ground = new THREE.Mesh(groundGeom, groundMat);
    this.ground.receiveShadow = true;
    this.add(this.ground);
  }

  getRandomNum(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }

  createTree() {
    var tree = new THREE.Group();
    this.ground.add(tree);
    tree.position.x = (Math.random() - 0.5) * 350;
    tree.position.z = (Math.random() - 0.5) * 350;
    
    var prevHeight = 0;
    var slices = this.getRandomNum(3, 7);
    var material = new THREE.MeshLambertMaterial({
      color: 0x41654b + (Math.random() - 0.5) * 100
    });
    for (var i = 0; i <= slices; i++) {
      var index = i / slices;
      var height = Math.random() * 3 + 5;
      var top = index * (2 - index) * 3.5;
      var width = 2 + i * 2;
      var sides = Math.ceil(Math.random() * 2) + 4;
      var geometry = new THREE.CylinderGeometry(top, width, height, sides);
      for (var j = 0; j < geometry.vertices.length; j++) {
        var vector = geometry.vertices[j];
        if (
          Math.floor(vector.y * 10) / 10 !==
          Math.floor((height / 2) * 10) / 10
        ) {
          vector.x += (Math.random() - 0.5) * 1;
          vector.z += (Math.random() - 0.5) * 1;
        }
      }
      geometry.computeFlatVertexNormals();
      var cylinder = new THREE.Mesh(geometry, material);
      cylinder.position.y = -prevHeight - height / 2;
      cylinder.rotation.y = Math.random() * Math.PI * 2;
      cylinder.castShadow = true;
      cylinder.receiveShadow = true;
      prevHeight += height;
      tree.add(cylinder);
      animate.from(
        cylinder.scale,
        0.5,
        {
          z: 0.01,
          y: 0.01,
          x: 0.01,
          // ease: Back.easeOut,
        }
      );
    }
    var geometry = new THREE.CylinderGeometry(1.2, 1.5, 3, 7);
    geometry.computeFlatVertexNormals();
    var material = new THREE.MeshLambertMaterial({ color: 0xa79375 });
    var log = new THREE.Mesh(geometry, material);
    log.position.y = -prevHeight - 1.5;
    tree.add(log);
    tree.position.y = prevHeight + 3;
  }


  bend(hits) {
    animate
      .to(hits[0].object.parent.scale, 0.2, new THREE.Vector3(0.4, 1, 1))
      .then(() => {
        animate.to(
          hits[0].object.parent.scale,
          0.2,
          new THREE.Vector3(1, 1, 1)
        );
      });
  }

  onAppDidUpdate(oldProps, oldState, newProps, newState) {
    if (newState.renderTrees !== oldState.renderTrees) {
      this.renderTrees();
    }
  }

  renderTrees() {
    for (var i = 0; i < 50; i++) {
      var delay = Math.random() * 1000;
      setTimeout(() => this.createTree(), delay);
    }
  }

  onTouchStart(ev, pos) {
    const [x, y] = pos;

    // For example, raycasting is easy:
    const coords = new THREE.Vector2().set(
      (pos[0] / webgl.width) * 2 - 1,
      (-pos[1] / webgl.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coords, webgl.camera);
    const hits = raycaster.intersectObject(this, true);
    if (hits[0] && hits[0].object.material.name === 'ground') {
      this.createTree();
      return;
    }
    if (hits.length > 0) {
      this.bend(hits);
    } else {
      this.createTree();
    }
  }
};
