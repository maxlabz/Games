const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Himmelblau

// Kamera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Licht
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// OrbitControls (zum Debuggen)
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Boden
const groundGeo = new THREE.PlaneGeometry(500, 500);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Test-Strecke
const roadGeo = new THREE.PlaneGeometry(50, 500);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.01;
scene.add(road);

// Auto (blauer Würfel)
const carGeo = new THREE.BoxGeometry(2, 1, 4);
const carMat = new THREE.MeshStandardMaterial({ color: 0x0044ff });
const car = new THREE.Mesh(carGeo, carMat);
car.position.set(0, 0.5, 0);
scene.add(car);

// Kamera-Position
camera.position.set(0, 8, -12);
camera.lookAt(car.position);
controls.target.copy(car.position);

// HUD
const hud = document.getElementById("hud");
let speed = 0;

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  hud.textContent = `Speed: ${speed} km/h`;
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
