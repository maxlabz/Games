import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

let scene, camera, renderer;
let playerCar;

init();
animate();

function init() {
  // Szene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Himmelblau

  // Kamera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, -10);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Licht
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  // Straße
  const roadGeometry = new THREE.PlaneGeometry(5, 500);
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.z = 250;
  scene.add(road);

  // Spieler-Auto (Placeholder: grüner Würfel)
  const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
  const carMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  playerCar = new THREE.Mesh(carGeometry, carMaterial);
  playerCar.position.set(0, 0.25, 0);
  scene.add(playerCar);

  // Fenstergröße anpassen
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

let speed = 0;
const maxSpeed = 0.5;

function animate() {
  requestAnimationFrame(animate);

  // Auto bewegen (geradeaus)
  if (speed < maxSpeed) speed += 0.002;
  playerCar.position.z += speed;
  camera.position.z = playerCar.position.z - 10;

  renderer.render(scene, camera);
}
