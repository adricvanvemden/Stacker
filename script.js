import * as THREE from 'three';
import { TWEEN } from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js';
import { level1, level2, level3, level4 } from './levels.js';
import { SceneSetup, CameraSetup, LightSetup } from './setup.js';
import { Player } from './player.js';

const levels = [level1, level2, level3, level4];
let level = 0;
let currentLevel = levels[level];

let overlay = document.getElementById('overlay');
let button = document.getElementById('button');
let info = document.getElementById('info');

// Initialize Three.js
const sceneSetup = new SceneSetup();
const scene = sceneSetup.scene;
const renderer = sceneSetup.renderer;
const cameraSetup = new CameraSetup(scene);
const camera = cameraSetup.camera;
const lightSetup = new LightSetup(scene);

function loadLevel() {
    // Clear the previous level
    for (let i = scene.children.length - 1; i >= 0; i--) {
        if (scene.children[i].userData.type) {
            scene.remove(scene.children[i]);
        }
    }

    // Check if there are more levels
    if (level < levels.length) {
        // Increment level to move on to the next level
        level++;
        const newLevel = levels[level];
        console.log('loadLevel', newLevel);
        currentLevel = newLevel;
        overlay.style.display = 'none';

        createBlocks(currentLevel);
        player.toStart(currentLevel);
    } else {
        console.log('No more levels');
    }
}

// Create grid of blocks
const geometry = new THREE.BoxGeometry(1, 1, 1);

let blocks = [];
function createBlocks(level) {
    console.log('createBlocks', level);
    for (let i = 0; i < level.length; i++) {
        let data = level[i];
        let cube;
        let material;



        if (data.type === 'start') {
            material = new THREE.MeshStandardMaterial ({ color: 0x00ff00 });

        } else if (data.type === 'finish') {
            material = new THREE.MeshStandardMaterial ({ color: 0xffffff });
        } else if (data.type === 'solid') {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Set the background color to purple
            context.fillStyle = 'purple';
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.fillStyle = 'white'; // Set the text color to white
            context.font = '100px bold Arial'; // Set the font size and style
            context.fillText((data.amount).toString(), canvas.width / 2, canvas.height / 2);

            // Use the canvas as a texture
            const texture = new THREE.CanvasTexture(canvas);
            material = new THREE.MeshStandardMaterial ({ map: texture });
        }

        cube = new THREE.Mesh(geometry, material);
        cube.position.x = data.xpos;
        cube.position.z = data.zpos;
        cube.userData.amount = data.amount;
        cube.userData.touchedCount = 0;
        cube.userData.type = data.type;
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add(cube);


        // Store the block in the blocks array
        if (!blocks[data.xpos]) {
            blocks[data.xpos] = [];
        }

        blocks[data.xpos][data.zpos] = cube;
    }
}
// Function to handle when a block is touched
function handleMoveOntoBlock(block, prevBlock) {
    if (prevBlock?.userData.type === 'solid' && prevBlock?.userData.touchedCount === prevBlock?.userData.amount) {
        blocks[prevBlock.position.x][prevBlock.position.z] = null;
    }

    block.userData.touchedCount++; // Increment the touchedCount property of the block

    if (block.userData.type === 'solid') {
        new TWEEN.Tween(block.position)
            .to({ y: block.position.y - 0.2 }, 200) // Move the block down by 0.2 units over 500 milliseconds
            .easing(TWEEN.Easing.Quadratic.Out) // Use quadratic easing for a smooth animation
            .onComplete(() => {
                // Move the block back up when the animation is complete
                new TWEEN.Tween(block.position)
                    .to({ y: block.position.y + 0.2 }, 200)
                    .start();
            })
            .start();

        // Create a new canvas and context
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Draw the background
        context.fillStyle = 'purple';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the text
        const text = (block.userData.amount - block.userData.touchedCount);
        context.fillStyle = 'white';
        context.font = '100px Inter';
        text > 0 && context.fillText(text.toString(), canvas.width / 4, canvas.height / 2)


        // Create a new texture from the canvas and set it as the map of the block's material
        block.material.map = new THREE.CanvasTexture(canvas);
        block.material.map.needsUpdate = true;
    }
}

async function handleMoveOffBlock(block) {

    // If the block has been touched the same number of times as its amount
    if (block.userData.type === 'solid' && block.userData.touchedCount === block.userData.amount) {
        // Create a tween for the fade out animation
        let fadeOut = new TWEEN.Tween(block.material)
            .to({ opacity: 0 }, 1000) // Fade out over 1 second
            .onComplete(() => {
                // Dispose of the geometry and material to free up memory
                block.geometry.dispose();
                block.material.dispose();

                // Remove the block from the scene
                scene.remove(block);
            });
        // Create a tween for the downward motion
        let moveDown = await new TWEEN.Tween(block.position)
            .to({ y: -10 }, 1000) // Move down over 1 second


        fadeOut.start();
        moveDown.start();

    }
}

// Add an event listener for the window's resize event
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    // Update the aspect ratio
    const aspect = window.innerWidth / window.innerHeight;

    // Update the camera's properties
    camera.left = -cameraSetup.d * aspect;
    camera.right = cameraSetup.d * aspect;
    camera.top = cameraSetup.d;
    camera.bottom = -cameraSetup.d;
    camera.updateProjectionMatrix();

    // Update the renderer's size
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function canMove(block) {
    let x = Math.round(block.position.x);
    let z = Math.round(block.position.z);

    // Check the blocks on all four sides
    if (blocks[x - 1] && blocks[x - 1][z] && blocks[x - 1][z].userData.type !== 'air') return true;
    if (blocks[x + 1] && blocks[x + 1][z] && blocks[x + 1][z].userData.type !== 'air') return true;
    if (blocks[x][z - 1] && blocks[x][z - 1].userData.type !== 'air') return true;
    if (blocks[x][z + 1] && blocks[x][z + 1].userData.type !== 'air') return true;

    return false;;
}

function reset() {
    console.log('reset');
    // Clear the previous level
    for (let i = scene.children.length - 1; i >= 0; i--) {
        if (scene.children[i].userData.type) {
            scene.remove(scene.children[i]);
        }
    }

    // Reset the current level
    currentLevel = levels[level];
    overlay.style.display = 'none';

    createBlocks(currentLevel);
    player.toStart(currentLevel);
}

function gameOver() {
    // Remove the existing event listener before adding a new one
    button.removeEventListener('click', () => { reset(); lockGame = false; });
    button.addEventListener('click', () => { reset(); lockGame = false; });
    button.innerText = 'Restart';

    // Show the game over message
    overlay.style.display = 'flex';
    info.innerText = 'Game Over!';
}

function isLevelFinished(block) {
    if (block.userData.type === 'finish') {
        // Check if all the other blocks are gone
        for (let i = 0; i < blocks.length; i++) {
            for (let j = 0; j < blocks[i].length; j++) {
                let data = blocks[i][j];
                if (data && data.userData.type === 'solid') {
                    return false;
                }
            }
        }

        return true;
    }

    return false;
}

let lastBlock = null;
let lockGame = false;

function shouldUpdatePlayerPosition() {
    let currentBlock = blocks[Math.round(player.player?.position.x)][Math.round(player.player?.position.z)];

    const complete = isLevelFinished(currentBlock);

    if (!lockGame) {
        if (complete) {
            lockGame = true;
            // Remove the existing event listener before adding a new one
            button.removeEventListener('click', () => { loadLevel(); lockGame = false; });
            button.addEventListener('click', () => { loadLevel(); lockGame = false; });

            // Show the overlay when all blocks are gone
            overlay.style.display = 'flex';
            info.innerText = 'Level Complete!';
        } else if (!complete && !canMove(currentBlock)) {
            lockGame = true;
            gameOver();
            return;
        } else {
            lockGame = false;
            updatePlayerPosition(currentBlock);
        }
    }


}

function updatePlayerPosition(currentBlock) {
    if (currentBlock !== lastBlock) {
        if (lastBlock) {
            handleMoveOffBlock(lastBlock);
        }
        if (currentBlock) {
            handleMoveOntoBlock(currentBlock, lastBlock);
        }
        lastBlock = currentBlock;
    }
}


// Render loop
function animate() {
    requestAnimationFrame(animate);
    shouldUpdatePlayerPosition();
    TWEEN.update();
    renderer.render(scene, camera);
}
createBlocks(level1);
const player = new Player(scene, blocks);
player.toStart(level1);
animate();

