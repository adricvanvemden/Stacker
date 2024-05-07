import * as THREE from 'three';

//scene
const scene = new THREE.Scene();

// Add a cube to the scene
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
cube.position.set(0, 0, 0);
scene.add(cube);

//lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(10, 20, 0); // x, y, z; Highest number gets the most light
scene.add(directionalLight);

//camera
const aspect = window.innerWidth / window.innerHeight;
// const perspectiveCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

const width = 10;
const height = width / aspect;
const orthographicCamera = new THREE.OrthographicCamera(-width, width, height, -height, 1, 1000);
orthographicCamera.position.set(5, 5, 5);
orthographicCamera.lookAt(scene.position);

//renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, orthographicCamera);

//add renderer to dom
document.body.appendChild(renderer.domElement);