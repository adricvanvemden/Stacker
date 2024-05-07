import * as THREE from 'three';
import * as CANNON from 'cannon-es';

let stack = [];
let overhangs = [];
const boxHeight = 1;

function cutBox(topLayer, overlap, size, delta) {
    const direction = topLayer.direction;
    const newWidth = direction === 'x' ? overlap : topLayer.width;
    const newDepth = direction === 'z' ? overlap : topLayer.depth;

    // update metadata
    topLayer.width = newWidth;
    topLayer.depth = newDepth;

    // update threeJS model
    topLayer.threejs.scale[direction] = overlap / size;
    topLayer.threejs.position[direction] -= delta / 2;

    // update cannonJS model
    topLayer.cannonjs.position[direction] -= delta / 2;

    // replace shape for smalelr one (cannonjs cant scale shape)
    const shape = new CANNON.Box(new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2));
    topLayer.cannonjs.shapes = [];
    topLayer.cannonjs.addShape(shape);
}

function addOverhang(x, z, width, depth) {
    const y = boxHeight * (stack.length - 1);
    const overhang = generateBox(x, y, z, width, depth, true);
    overhangs.push(overhang);
}


function addLayer(x, z, width, depth, direction) {
    const y = boxHeight * stack.length;

    const layer = generateBox(x, y, z, width, depth, false);
    layer.direction = direction;

    stack.push(layer);
}

function generateBox(x, y, z, width, depth, falls) {
    //ThreeJS
    const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
    const color = new THREE.Color(`hsl(${30 + stack.length * 4}, 100%, 50%)`);
    const material = new THREE.MeshLambertMaterial({ color });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);

    scene.add(mesh);


    //CannonJS
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2));
    let mass = falls ? 5 : 0;
    mass *= width / originalBoxSize; // reduce mass based on size
    mass *= depth / originalBoxSize; // reduce mass based on size
    const body = new CANNON.Body({ mass, shape });
    body.position.set(x, y, z);
    world.addBody(body);

    return {
        threejs: mesh,
        cannonjs: body,
        width,
        depth
    };
}



let gameStarted = false;

window.addEventListener('click', () => {
    if (!gameStarted) {
        renderer.setAnimationLoop(animation);
        gameStarted = true;
    } else {
        const topLayer = stack[stack.length - 1];
        const previousLayer = stack[stack.length - 2];

        const direction = topLayer.direction;

        const delta = topLayer.threejs.position[direction] - previousLayer.threejs.position[direction];

        const overhangSize = Math.abs(delta);

        const size = topLayer.threejs.geometry.parameters[direction === 'x' ? 'width' : 'depth'];

        const overlap = size - overhangSize;

        if (overlap > 0) {
            cutBox(topLayer, overlap, size, delta);

            // overhang
            const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
            const overhangX = direction === 'x' ? topLayer.threejs.position.x + overhangShift : topLayer.threejs.position.x;
            const overhangZ = direction === 'z' ? topLayer.threejs.position.z + overhangShift : topLayer.threejs.position.z;
            const overhangWidth = direction === 'x' ? overhangSize : topLayer.width;
            const overhangDepth = direction === 'z' ? overhangSize : topLayer.depth;

            addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

            // next layer
            const nextX = direction === 'x' ? topLayer.threejs.position.x : -10;
            const nextZ = direction === 'z' ? topLayer.threejs.position.z : -10;
            const newWidth = topLayer.width; // New layer has the same size as the cut top layer
            const newDepth = topLayer.depth; // New layer has the same size as the cut top layer
            const nextDirection = direction === 'x' ? 'z' : 'x';

            addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);

        }



    }
});

function animation() {
    const speed = 0.10;
    const topLayer = stack[stack.length - 1];
    topLayer.threejs.position[topLayer.direction] += speed;
    topLayer.cannonjs.position[topLayer.direction] += speed;

    // 4 is initial camera height 
    if (orthographicCamera.position.y < boxHeight * (stack.length - 2) + 4) {
        orthographicCamera.position.y += speed;
    }

    updatePhysics();
    renderer.render(scene, orthographicCamera);

}

function updatePhysics() {
    world.step(1 / 100);

    // Copy coordinates from CannonJS to ThreeJS
    overhangs.forEach(overhang => {
        overhang.threejs.position.copy(overhang.cannonjs.position);
        overhang.threejs.quaternion.copy(overhang.cannonjs.quaternion);
    });
}


//ThreeJS globals
let orthographicCamera, scene, renderer;

//CannonJS globals
let world;

const originalBoxSize = 3;

function init() {
    // init CannonJS
    world = new CANNON.World();
    world.gravity.set(0, -10, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 40;

    // init ThreeJS
    scene = new THREE.Scene();

    //foundation
    addLayer(0, 0, originalBoxSize, originalBoxSize);

    //first layer
    addLayer(-10, 0, originalBoxSize, originalBoxSize, 'x');

    //lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 20, 0); // x, y, z; Highest number gets the most light
    scene.add(directionalLight);
    

    //camera
    const aspect = window.innerWidth / window.innerHeight;
    const width = 10;
    const height = width / aspect;
    orthographicCamera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 100);
    orthographicCamera.position.set(4, 4, 4);
    orthographicCamera.lookAt(scene.position);

    //renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, orthographicCamera);
    document.body.appendChild(renderer.domElement);
}
init();

window.addEventListener("resize", () => {
    // Adjust camera
    console.log("resize", window.innerWidth, window.innerHeight);
    const aspect = window.innerWidth / window.innerHeight;
    const width = 10;
    const height = width / aspect;

    orthographicCamera.top = height / 2;
    orthographicCamera.bottom = height / -2;
    orthographicCamera.left = width / -2;
    orthographicCamera.right = width / 2;

    // Update the camera's aspect ratio and projection matrix
    orthographicCamera.updateProjectionMatrix();

    // Reset renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, orthographicCamera);
});