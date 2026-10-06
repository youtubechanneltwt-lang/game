const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const healthText = document.getElementById("health");
const ammoText = document.getElementById("ammo");
const killsText = document.getElementById("kills");
const message = document.getElementById("message");
const gameOver = document.getElementById("gameOver");
const finalKills = document.getElementById("finalKills");
const damageScreen = document.getElementById("damage");

let W, H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

/* =========================
   GAME VARIABLES
========================= */

let playing = false;

let player = {
  x: 0,
  y: 0,
  angle: 0,
  health: 100,
  ammo: 30,
  speed: 4
};

let kills = 0;
let enemies = [];
let bullets = [];
let particles = [];

const keys = {};

/* =========================
   KEYBOARD
========================= */

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === "r") {
    reload();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

/* =========================
   MOUSE AIM
========================= */

window.addEventListener("mousemove", e => {
  if (!playing) return;

  player.angle += e.movementX * 0.003;
});

/* =========================
   START
========================= */

document.getElementById("startBtn").addEventListener("click", () => {

  message.style.display = "none";

  playing = true;

  canvas.requestPointerLock();

  spawnEnemies();

  gameLoop();
});

/* =========================
   SHOOTING
========================= */

window.addEventListener("mousedown", e => {

  if (!playing) return;

  if (e.button === 0) {
    shoot();
  }

});

function shoot() {

  if (player.ammo <= 0) {
    reload();
    return;
  }

  player.ammo--;

  ammoText.textContent = player.ammo;

  bullets.push({
    x: player.x,
    y: player.y,
    angle: player.angle,
    life: 35
  });

  createMuzzleFlash();

  checkHit();
}

/* =========================
   RELOAD
========================= */

function reload() {

  if (!playing) return;

  player.ammo = 30;
  ammoText.textContent = player.ammo;
}

/* =========================
   ENEMY SPAWN
========================= */

function spawnEnemies() {

  for (let i = 0; i < 8; i++) {

    enemies.push({
      x: (Math.random() - .5) * 1600,
      y: (Math.random() - .5) * 1600,
      health: 100,
      speed: 0.5 + Math.random() * .4,
      attackTimer: Math.random() * 100
    });

  }

}

/* =========================
   MOVEMENT
========================= */

function updatePlayer() {

  let moveX = 0;
  let moveY = 0;

  if (keys["w"]) moveY += 1;
  if (keys["s"]) moveY -= 1;
  if (keys["a"]) moveX -= 1;
  if (keys["d"]) moveX += 1;

  const sin = Math.sin(player.angle);
  const cos = Math.cos(player.angle);

  player.x += (moveX * cos - moveY * sin) * player.speed;
  player.y += (moveX * sin + moveY * cos) * player.speed;
}

/* =========================
   ENEMY AI
========================= */

function updateEnemies() {

  enemies.forEach(enemy => {

    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;

    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 80) {

      enemy.x += dx / distance * enemy.speed;
      enemy.y += dy / distance * enemy.speed;

    } else {

      enemy.attackTimer++;

      if (enemy.attackTimer > 80) {

        enemy.attackTimer = 0;

        player.health -= 8;

        healthText.textContent = Math.max(0, player.health);

        damageScreen.classList.remove("damage-animation");

        void damageScreen.offsetWidth;

        damageScreen.classList.add("damage-animation");

        if (player.health <= 0) {
          endGame();
        }

      }

    }

  });

}

/* =========================
   HIT DETECTION
========================= */

function checkHit() {

  const shootingAngle = player.angle;

  let closest = null;
  let closestDistance = Infinity;

  enemies.forEach(enemy => {

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 700) return;

    const enemyAngle = Math.atan2(dy, dx);

    let difference = normalizeAngle(
      enemyAngle - shootingAngle
    );

    if (Math.abs(difference) < 0.09) {

      if (distance < closestDistance) {

        closest = enemy;
        closestDistance = distance;

      }

    }

  });

  if (closest) {

    closest.health -= 50;

    createHitParticles(closest.x, closest.y);

    if (closest.health <= 0) {

      const index = enemies.indexOf(closest);

      enemies.splice(index, 1);

      kills++;

      killsText.textContent = kills;

      setTimeout(() => {

        if (playing) {

          enemies.push({
            x: player.x + (Math.random() - .5) * 1400,
            y: player.y + (Math.random() - .5) * 1400,
            health: 100,
            speed: 0.5 + Math.random() * .5,
            attackTimer: 0
          });

        }

      }, 1000);

    }

  }

}

function normalizeAngle(angle) {

  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;

  return angle;
}

/* =========================
   PARTICLES
========================= */

function createHitParticles(x, y) {

  for (let i = 0; i < 12; i++) {

    particles.push({
      x,
      y,
      vx: (Math.random() - .5) * 5,
      vy: (Math.random() - .5) * 5,
      life: 30
    });

  }

}

function createMuzzleFlash() {

  for (let i = 0; i < 5; i++) {

    particles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(player.angle) * 5,
      vy: Math.sin(player.angle) * 5,
      life: 10
    });

  }

}

/* =========================
   BULLETS
========================= */

function updateBullets() {

  bullets.forEach(bullet => {

    bullet.x += Math.cos(bullet.angle) * 15;
    bullet.y += Math.sin(bullet.angle) * 15;

    bullet.life--;

  });

  bullets = bullets.filter(b => b.life > 0);

}

/* =========================
   PARTICLE UPDATE
========================= */

function updateParticles() {

  particles.forEach(p => {

    p.x += p.vx;
    p.y += p.vy;

    p.life--;

  });

  particles = particles.filter(p => p.life > 0);

}

/* =========================
   3D PROJECTION
========================= */

function project(x, y) {

  const dx = x - player.x;
  const dy = y - player.y;

  const sin = Math.sin(player.angle);
  const cos = Math.cos(player.angle);

  const forward = dx * cos + dy * sin;
  const side = -dx * sin + dy * cos;

  return {
    depth: forward,
    screenX: W / 2 + side * 450 / Math.max(forward, 1),
    scale: 450 / Math.max(forward, 1)
  };

}

/* =========================
   DRAW WORLD
========================= */

function drawWorld() {

  /* SKY */

  const sky = ctx.createLinearGradient(0, 0, 0, H * .55);

  sky.addColorStop(0, "#55a7d8");
  sky.addColorStop(1, "#d5e9ee");

  ctx.fillStyle = sky;

  ctx.fillRect(0, 0, W, H * .55);

  /* GROUND */

  const ground = ctx.createLinearGradient(0, H * .5, 0, H);

  ground.addColorStop(0, "#65745d");
  ground.addColorStop(1, "#1e261e");

  ctx.fillStyle = ground;

  ctx.fillRect(0, H * .5, W, H * .5);

  drawRoad();

  drawTrees();

  drawEnemies();

  drawBullets();

  drawParticles();

  drawWeapon();

}

/* =========================
   ROAD
========================= */

function drawRoad() {

  ctx.fillStyle = "#303238";

  ctx.beginPath();

  ctx.moveTo(W * .43, H * .5);
  ctx.lineTo(W * .57, H * .5);
  ctx.lineTo(W * .85, H);
  ctx.lineTo(W * .15, H);

  ctx.closePath();

  ctx.fill();

  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 4;

  ctx.setLineDash([25, 30]);

  ctx.beginPath();

  ctx.moveTo(W / 2, H * .5);
  ctx.lineTo(W / 2, H);

  ctx.stroke();

  ctx.setLineDash([]);

}

/* =========================
   TREES
========================= */

function drawTrees() {

  for (let i = -5; i <= 5; i++) {

    let x = player.x + i * 300;
    let y = player.y + 500 + Math.abs(i) * 50;

    drawTree(x, y);

  }

}

function drawTree(x, y) {

  const p = project(x, y);

  if (p.depth <= 10 || p.depth > 1500) return;

  const size = 100 * p.scale;

  ctx.fillStyle = "#573d25";

  ctx.fillRect(
    p.screenX - size * .1,
    H * .5 - size * .35,
    size * .2,
    size * .8
  );

  ctx.fillStyle = "#165c2a";

  ctx.beginPath();

  ctx.arc(
    p.screenX,
    H * .5 - size * .5,
    size * .45,
    0,
    Math.PI * 2
  );

  ctx.fill();

}

/* =========================
   ENEMIES
========================= */

function drawEnemies() {

  enemies
    .map(enemy => ({
      enemy,
      p: project(enemy.x, enemy.y)
    }))
    .filter(o => o.p.depth > 10 && o.p.depth < 1500)
    .sort((a, b) => b.p.depth - a.p.depth)
    .forEach(o => {

      const enemy = o.enemy;
      const p = o.p;

      const size = 130 * p.scale;

      /* Shadow */

      ctx.fillStyle = "rgba(0,0,0,.35)";

      ctx.beginPath();

      ctx.ellipse(
        p.screenX,
        H * .5 + size * .45,
        size * .35,
        size * .12,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /* Body */

      ctx.fillStyle = "#1d1d1d";

      ctx.fillRect(
        p.screenX - size * .22,
        H * .5 - size * .1,
        size * .44,
        size * .55
      );

      /* Head */

      ctx.fillStyle = "#d09270";

      ctx.beginPath();

      ctx.arc(
        p.screenX,
        H * .5 - size * .25,
        size * .18,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /* Red enemy marker */

      ctx.fillStyle = "#ff3030";

      ctx.fillRect(
        p.screenX - size * .3,
        H * .5 - size * .7,
        size * .6,
        5
      );

      /* Health */

      ctx.fillStyle = "#22e650";

      ctx.fillRect(
        p.screenX - size * .3,
        H * .5 - size * .7,
        size * .6 * (enemy.health / 100),
        5
      );

    });

}

/* =========================
   BULLET DRAW
========================= */

function drawBullets() {

  bullets.forEach(b => {

    const p = project(b.x, b.y);

    if (p.depth > 0) {

      ctx.fillStyle = "#fff";

      ctx.beginPath();

      ctx.arc(
        p.screenX,
        H * .5,
        3,
        0,
        Math.PI * 2
      );

      ctx.fill();

    }

  });

}

/* =========================
   PARTICLE DRAW
========================= */

function drawParticles() {

  particles.forEach(particle => {

    const p = project(
      particle.x,
      particle.y
    );

    if (p.depth <= 0) return;

    ctx.fillStyle = "#ffcc00";

    ctx.beginPath();

    ctx.arc(
      p.screenX,
      H * .5,
      Math.max(2, 5 * p.scale),
      0,
      Math.PI * 2
    );

    ctx.fill();

  });

}

/* =========================
   WEAPON
========================= */

function drawWeapon() {

  const gunWidth = Math.min(W * .25, 260);

  const gunHeight = gunWidth * .45;

  const x = W / 2 - gunWidth / 2;
  const y = H - gunHeight * .8;

  ctx.fillStyle = "#151515";

  ctx.fillRect(
    x,
    y,
    gunWidth,
    gunHeight * .4
  );

  ctx.fillStyle = "#292929";

  ctx.fillRect(
    x + gunWidth * .55,
    y + gunHeight * .35,
    gunWidth * .15,
    gunHeight * .65
  );

  ctx.fillStyle = "#555";

  ctx.fillRect(
    x + gunWidth * .85,
    y + gunHeight * .15,
    gunWidth * .35,
    gunHeight * .18
  );

}

/* =========================
   GAME OVER
========================= */

function endGame() {

  playing = false;

  document.exitPointerLock();

  finalKills.textContent = kills;

  gameOver.style.display = "block";

}

/* =========================
   GAME LOOP
========================= */

function gameLoop() {

  if (!playing) return;

  updatePlayer();

  updateEnemies();

  updateBullets();

  updateParticles();

  ctx.clearRect(0, 0, W, H);

  drawWorld();

  requestAnimationFrame(gameLoop);

}
