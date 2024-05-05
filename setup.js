import * as THREE from 'three';

export class SceneSetup {
    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
    }
}

export class CameraSetup {
    constructor(scene) {
        const aspect = window.innerWidth / window.innerHeight;
        const d = 4;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.camera.position.set(d, d, d);
        this.camera.lookAt(scene.position);
    }
}

export class LightSetup {
    constructor(scene) {
        this.addDirectionalLight(scene, 0xFFFFFF, 1, 0, 10, 0); // light from above
        this.addDirectionalLight(scene, 0xFFFFFF, 0.5, 10, 0, 0); // light from the side
        this.addDirectionalLight(scene, 0xFFFFFF, 0.5, 0, 0, 10); // light from the front
    }

    addDirectionalLight(scene, color, intensity, x, y, z) {
        var light = new THREE.DirectionalLight(color, intensity);
        light.position.set(x, y, z);
        light.castShadow = true;
        scene.add(light);
    }
}