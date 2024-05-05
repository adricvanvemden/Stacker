import * as THREE from 'three';
import { TWEEN } from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js';

export class Player {
    constructor(scene, blocks, color = 0xff0000) {
        const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const playerMaterial = new THREE.MeshBasicMaterial({ color: color });
        const player = new THREE.Mesh(playerGeometry, playerMaterial);
        player.castShadow = true;
        player.receiveShadow = true;
        scene.add(player);

        this.blocks = blocks;

        this.addControls.bind(this);
        this.addControls();
        this.setPosition.bind(this);
        this.toStart.bind(this);
        this.player = player;
    }

    setPosition(x, z) {
        new TWEEN.Tween(this.player.position)
        .to({ x: x, y: 0.3, z: z }, 200) // Move to the new position and down by 0.2 units over 200 milliseconds
        .easing(TWEEN.Easing.Quadratic.Out) // Use quadratic easing for a smooth animation
        .onComplete(() => {
            // Move the player back down when the animation is complete
            new TWEEN.Tween(this.player.position)
                .to({ y: 0.5 }, 200)
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
                this.player.position.set(data.xpos, 0.5, data.zpos);
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
                    }
                    break;
                case 'a':
                    if (this.blocks[x - 1] && this.blocks[x - 1][z]) {
                        this.setPosition(x - 1, z);
                    }
                    break;
                case 's':
                    if (this.blocks[x] && this.blocks[x][z + 1]) {
                        this.setPosition(x, z + 1);
                    }
                    break;
                case 'd':
                    if (this.blocks[x + 1] && this.blocks[x + 1][z]) {
                        this.setPosition(x + 1, z);
                    }
                    break;
            }
        });
    }
}
