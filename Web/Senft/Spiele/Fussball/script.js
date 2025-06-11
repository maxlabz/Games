const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerWidth = 10, playerHeight = 60;
let player1 = { x: 30, y: 170 };
let player2 = { x: 760, y: 170 };
let ball = { x: 395, y: 195, vx: 4, vy: 3 };
let score1 = 0, score2 = 0;
let keys = {};
let mode = '2player';

function resetBall() {
  ball.x = 395;
  ball.y = 195;
  ball.vx = -ball.vx;
  ball.vy = (Math.random() * 4 - 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Spieler
  ctx.fillStyle = 'white';
  ctx.fillRect(player1.x, player1.y, playerWidth, playerHeight);
  ctx.fillRect(player2.x, player2.y, playerWidth, playerHeight);

  // Ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
  ctx.fill();

  // Mittellinie
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(400, 0);
  ctx.lineTo(400, 400);
  ctx.strokeStyle = "white";
  ctx.stroke();
  ctx.setLineDash([]);
}

function update() {
  // Steuerung Spieler 1
  if (keys['w'] && player1.y > 0) player1.y -= 5;
  if (keys['s'] && player1.y + playerHeight < canvas.height) player1.y += 5;

  // Steuerung Spieler 2 oder CPU
  if (mode === '2player') {
    if (keys['ArrowUp'] && player2.y > 0) player2.y -= 5;
    if (keys['ArrowDown'] && player2.y + playerHeight < canvas.height) player2.y += 5;
  } else if (mode === 'cpu') {
    if (ball.y < player2.y + playerHeight / 2) player2.y -= 3;
    else if (ball.y > player2.y + playerHeight / 2) player2.y += 3;
  }

  // Ball bewegen
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Ball oben/unten abprallen lassen
  if (ball.y < 0 || ball.y > canvas.height) ball.vy *= -1;

  // Ball trifft Spieler 1
  if (
    ball.x < player1.x + playerWidth &&
    ball.y > player1.y &&
    ball.y < player1.y + playerHeight
  ) {
    ball.vx *= -1;
  }

  // Ball trifft Spieler 2
  if (
    ball.x > player2.x &&
    ball.y > player2.y &&
    ball.y < player2.y + playerHeight
  ) {
    ball.vx *= -1;
  }

  // Tor für Spieler 1
  if (ball.x > canvas.width) {
    score1++;
    document.getElementById('score1').textContent = score1;
    resetBall();
  }

  // Tor für Spieler 2
  if (ball.x < 0) {
    score2++;
    document.getElementById('score2').textContent = score2;
    resetBall();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function startGame(m) {
  mode = m;
  score1 = 0;
  score2 = 0;
  player1.y = 170;
  player2.y = 170;
  resetBall();
  document.getElementById('score1').textContent = 0;
  document.getElementById('score2').textContent = 0;
}

document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

gameLoop();
