const { assets } = require('../../context');

const gltfKey = assets.queue({
  url: 'assets/models/cloud3.gltf'
});

module.exports = class Cloud3 extends THREE.Object3D {
  constructor () {
    super();

    // now fetch the loaded resource
    this.geometry = assets.get(gltfKey);
    
    this.material = new THREE.MeshStandardMaterial();
    console.log(this.geometry.scene)
  
    this.children = [];
  
    this.geometry.scene.traverse(child => {
      if (child.isMesh) {
        child.material = this.material;
        
        // ThreeJS attaches something odd here on GLTF ipmport
        child.onBeforeRender = () => {};
        this.children.push(child);
      }
    });
    this.add(this.geometry.scene);
  }
};
