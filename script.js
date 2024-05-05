import * as THREE from 'three';
import { TWEEN } from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js';
import { level1, level2, level3, level4 } from './levels.js';

const levels = { level1, level2, level3, level4 };
let level = 'level1';
let currentLevel = level1;

let overlay = document.getElementById('overlay');
let nextLevelButton = document.getElementById('nextLevelButton');
let levelCompleteText = document.getElementById('levelCompleteText');

let nextLevel = null;

function loadNextLevel() {
    if (nextLevel) {
        loadLevel(nextLevel);
    }
}

// Initialize Three.js
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create isometric projection
const aspect = window.innerWidth / window.innerHeight;
const d = 4;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
camera.position.set(d, d, d); // all components equal
camera.lookAt(scene.position); // or the origin


function loadLevel(level) {
    // Clear the previous level
    for (let i = scene.children.length - 1; i >= 0; i--) {
        if (scene.children[i].userData.type) {
            scene.remove(scene.children[i]);
        }
    }
    console.log('loadLevel', level);
    currentLevel = level;
    overlay.style.display = 'none';

    createBlocks(level);
    toStart();
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
            material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        } else if (data.type === 'finish') {
            material = new THREE.MeshBasicMaterial({ color: 0xffffff });
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
            material = new THREE.MeshBasicMaterial({ map: texture });
        }

        cube = new THREE.Mesh(geometry, material);
        cube.position.x = data.xpos;
        cube.position.z = data.zpos;
        cube.userData.amount = data.amount;
        cube.userData.touchedCount = 0;
        cube.userData.type = data.type;
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

// Add player
const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);

scene.add(player);

function setPlayerPosition(x, z) {
    player.position.set(x, 0.5, z);
}

function toStart() {
    // Find the start block
    for (let i = 0; i < currentLevel.length; i++) {
        let data = currentLevel[i];
        if (data.type === 'start') {
            // Position the player on top of the start block
            setPlayerPosition(data.xpos, data.zpos);
            break;
        }
    }
}

// Add event listener for keydown events
document.addEventListener('keydown', function (event) {
    let x = Math.round(player.position.x);
    let z = Math.round(player.position.z);
    switch (event.key) {
        case 'w':
            if (blocks[x] && blocks[x][z - 1]) {
                player.position.z -= 1;
            }
            break;
        case 'a':
            if (blocks[x - 1] && blocks[x - 1][z]) {
                player.position.x -= 1;
            }
            break;
        case 's':
            if (blocks[x] && blocks[x][z + 1]) {
                player.position.z += 1;
            }
            break;
        case 'd':
            if (blocks[x + 1] && blocks[x + 1][z]) {
                player.position.x += 1;
            }
            break;
    }
});

// Add an event listener for the window's resize event
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    // Update the aspect ratio
    const aspect = window.innerWidth / window.innerHeight;

    // Update the camera's properties
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
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

function gameOver() {
    // Show the game over message
    overlay.style.display = 'flex';
    levelCompleteText.innerText = 'Game Over!';
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

        let levelNumber = parseInt(level.replace('level', '')); // strip the 'level' string and convert to number
        levelNumber++; // increment the level number
        nextLevel = levels['level' + levelNumber];
        
        // Remove the existing event listener before adding a new one
        nextLevelButton.removeEventListener('click', loadNextLevel);
        nextLevelButton.addEventListener('click', loadNextLevel);

        // Show the overlay when all blocks are gone
        overlay.style.display = 'flex';
        levelCompleteText.innerText = 'Level Complete!';

        return true;
    }

    return false;
}

let lastBlock = null;

function updatePlayerPosition() {

    let currentBlock = blocks[Math.round(player.position.x)][Math.round(player.position.z)];

    if (currentBlock !== lastBlock) {
        if (lastBlock) {
            handleMoveOffBlock(lastBlock);
        }
        if (currentBlock) {
            handleMoveOntoBlock(currentBlock, lastBlock);
        }
        lastBlock = currentBlock;
    }

    const complete = isLevelFinished(currentBlock);

    if (complete) {
        levelCompleteText.innerText = 'Level Complete!';
        overlay.style.display = 'flex';
    }


    if (!complete && !canMove(lastBlock)) {
        gameOver();
        return;
    }
}


// Render loop
function animate() {
    requestAnimationFrame(animate);
    updatePlayerPosition();
    TWEEN.update();
    renderer.render(scene, camera);
}
createBlocks(level1);
toStart();
animate();

