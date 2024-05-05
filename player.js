import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TWEEN } from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js';

const loader = new GLTFLoader();
export class Player {
    constructor(scene, blocks) {
        const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const playerMaterial = new THREE.MeshBasicMaterial({ color: '#fff' });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        this.ypos = 1;

        loader.load('./Kitten.glb', (glb) => {
            // The loaded model is stored in gltf.scene
            this.player = glb.scene;

            // You might need to adjust the scale of the model to fit your game
            // this.player.scale.set(0.2, 0.2, 0.2); // Capuchin
            //this.player.position.set(0, 0.5, 0); // Capuchin

            this.player.scale.set(0.02, 0.02, 0.02); // Kitten
            this.player.position.set(0, this.ypos, 0); // Kitten


            // Change the color of the model
            this.player.traverse((node) => {
                if (node.isMesh) {
                    // Remove the texture
                    // node.material.map = null;

                    // node.material.color.set('#06ff8f');
                }
            });

            this.player.castShadow = true;
            this.player.receiveShadow = true;

            // Add the model to the scene
            scene.add(this.player);
        });


        this.blocks = blocks;

        this.addControls.bind(this);
        this.addControls();
        this.setPosition.bind(this);
        this.toStart.bind(this);
    }

    setPosition(x, z) {
        new TWEEN.Tween(this.player.position)
            .to({ x: x, y: this.ypos - 0.2, z: z }, 200) // Move to the new position and down by 0.2 units over 200 milliseconds
            .easing(TWEEN.Easing.Quadratic.Out) // Use quadratic easing for a smooth animation
            .onComplete(() => {
                // Move the player back down when the animation is complete
                new TWEEN.Tween(this.player.position)
                    .to({ y: this.ypos }, 200)
                    .start();
            })
            .start(); // Start the tween immediately
    }

    getPosition() {
        return this.player.position;
    }


    toStart(level) {
        // Find the start block
        for (let i = 0; i < level.length; i++) {
            let data = level[i];
            if (data.type === 'start') {
                // Position the player on top of the start block
                this.player.position.set(data.xpos, this.ypos, data.zpos);
                break;
            }
        }
    }

    addControls() {
        // Add event listener for keydown events
        document.addEventListener('keydown', (event) => {
            let x = Math.round(this.player.position.x);
            let z = Math.round(this.player.position.z);
            switch (event.key) {
                case 'w':
                    if (this.blocks[x] && this.blocks[x][z - 1]) {
                        this.setPosition(x, z - 1);
                        this.player.rotation.y = Math.PI; // Rotate 180 degrees
                    }
                    break;
                case 'a':
                    if (this.blocks[x - 1] && this.blocks[x - 1][z]) {
                        this.setPosition(x - 1, z);
                        this.player.rotation.y = -Math.PI / 2; // Rotate 90 degrees
                    }
                    break;
                case 's':
                    if (this.blocks[x] && this.blocks[x][z + 1]) {
                        this.setPosition(x, z + 1);
                        this.player.rotation.y = 0; // Rotate 0 degrees
                    }
                    break;
                case 'd':
                    if (this.blocks[x + 1] && this.blocks[x + 1][z]) {
                        this.setPosition(x + 1, z);
                        this.player.rotation.y = Math.PI / 2; // Rotate -90 degrees
                    }
                    break;
            }
        });
    }
}
