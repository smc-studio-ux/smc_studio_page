const canvas = document.getElementById("interactive-bg");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let isMobile = window.innerWidth <= 768;

let particles = [];
let mouse = { x: null, y: null };
let textTargets = [];
let textInfluence = 0;
let forming = false;

const TOTAL_PARTICLES = isMobile ? 350 : 1500;

const TEXT_PARTICLE_RATIO = 0.9;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  isMobile = window.innerWidth <= 768;
});

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

/* ================= PARTICLE ================= */

class Particle {
  constructor(index) {
    this.index = index;
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    this.vx = 0;
    this.vy = 0;

    this.size = Math.random() * 2.5 + 1.2;
    this.speed = Math.random() * 0.2 + 0.05;
    this.opacity = Math.random() * 0.07 + 0.05;

    this.target = null;
    this.isTextParticle = false;
    this.noiseOffset = Math.random() * 1000;
  }

  update(time) {
    const formingStrong = this.isTextParticle && textInfluence > 0.6;
    const formingSoft = this.isTextParticle && textInfluence > 0.05;

    /* ================= TEXTO FUERTE ================= */
    if (formingStrong) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;

      this.vx += dx * 0.015;
      this.vy += dy * 0.015;

      // micro vibración
      this.vx += Math.sin(time * 0.002 + this.noiseOffset) * 0.02;
      this.vy += Math.cos(time * 0.002 + this.noiseOffset) * 0.02;
    } else if (formingSoft) {
      /* ================= TRANSICIÓN ================= */
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;

      this.vx += dx * 0.01 * textInfluence;
      this.vy += dy * 0.01 * textInfluence;

      // empieza a recuperar drift vertical
      this.vy -= this.speed * (1 - textInfluence);
    } else {
      /* ================= FONDO NORMAL ================= */
      this.vy -= this.speed * 0.4;
      this.vx += Math.sin((this.y + this.noiseOffset) * 0.01) * 0.02;
    }

    this.mouseInteraction();

    /* ===== Fricción global suave ===== */
    this.vx *= 0.92;
    this.vy *= 0.92;

    /* ===== Limitar velocidad máxima ===== */
    const maxSpeed = 2;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    /* ===== Reciclado superior ===== */
    if (this.y < 0) {
      this.y = canvas.height;
      this.x = Math.random() * canvas.width;
    }
  }

  mouseInteraction() {
    if (!mouse.x) return;

    let dx = this.x - mouse.x;
    let dy = this.y - mouse.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    const radius = 110;

    if (dist < radius) {
      const angle = Math.atan2(dy, dx);
      const force = (radius - dist) / radius;

      // 🔥 fuerza mucho más suave
      this.vx += Math.cos(angle) * force * 0.8;
      this.vy += Math.sin(angle) * force * 0.8;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

    const baseOpacity = this.opacity;
    const textBoost = this.isTextParticle ? textInfluence * 0.25 : 0;

    ctx.fillStyle = `rgba(220,240,255,${baseOpacity + textBoost})`;

    ctx.fill();
  }
}

/* ================= TEXTO ================= */

function generateTextTargets() {
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  const fontSize = Math.min(canvas.width * 0.18, 260);

  tempCtx.font = `900 ${fontSize}px Arial Black`;
  tempCtx.textBaseline = "middle";

  const text = "SMC";
  const textWidth = tempCtx.measureText(text).width;

  const startX = canvas.width * 0.08;
  const startY = canvas.height * 0.45;

  tempCtx.fillStyle = "white";
  tempCtx.fillText(text, startX, startY);

  const imageData = tempCtx.getImageData(
    startX,
    startY - fontSize,
    textWidth,
    fontSize * 1.5,
  );

  textTargets = [];

  const step = 5;

  for (let y = 0; y < imageData.height; y += step) {
    for (let x = 0; x < imageData.width; x += step) {
      const index = (y * imageData.width + x) * 4;

      if (imageData.data[index + 3] > 150) {
        textTargets.push({
          x: startX + x,
          y: startY - fontSize + y,
        });
      }
    }
  }

  assignTargets();
}

function assignTargets() {
  textTargets.sort(() => Math.random() - 0.5);

  const textParticleCount = Math.min(
    Math.floor(TOTAL_PARTICLES * TEXT_PARTICLE_RATIO),
    textTargets.length,
  );

  for (let i = 0; i < particles.length; i++) {
    if (i < textParticleCount) {
      particles[i].target = textTargets[i];
      particles[i].isTextParticle = true;
    } else {
      particles[i].target = null;
      particles[i].isTextParticle = false;
    }
  }
}

/* ================= INIT ================= */

function init() {
  particles = [];

  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    particles.push(new Particle(i));
  }

  if (!isMobile) {
    generateTextTargets();
  }
}

function animate(time = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p) => {
    p.update(time);
    p.draw();
  });

  if (forming && textInfluence < 1) {
    textInfluence += 0.01;
  } else if (!forming && textInfluence > 0) {
    textInfluence -= 0.01;
  }

  requestAnimationFrame(animate);
}

init();
animate();

/* ================= CICLO ================= */

if (!isMobile) {
  setInterval(() => {
    forming = true;

    setTimeout(() => {
      forming = false;
    }, 10000);
  }, 22000);
}
