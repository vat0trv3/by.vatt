let particles = [];
let maxParticles = 180; // doble que antes
let trailLength = 27;
let fft, amplitude;
let sounds = [];
let currentSound = 0;
let bgImg;

let turquoiseParticles = [];
let turquoiseCount = 100;

function preload() {
  sounds[0] = loadSound('assets1/2.wav');
  sounds[1] = loadSound('assets1/4.wav');

  if (windowWidth > windowHeight) {
    bgImg = loadImage('assets1/FONDO1.png');
  } else {
    bgImg = loadImage('assets1/FONDO1_vertical.png');
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');
  canvas.style('position', 'fixed');

  userStartAudio();

  fft = new p5.FFT(0.9, 1024);
  amplitude = new p5.Amplitude();

  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  // Inicializa partículas turquesa
  for (let i = 0; i < turquoiseCount; i++) {
    turquoiseParticles.push(new TurquoiseParticle());
  }

  playNextSound();
}

function draw() {
  background(0);

  // Dibuja fondo centrado
  let imgAspect = bgImg.width / bgImg.height;
  let canvasAspect = width / height;
  let drawWidth, drawHeight;

  if (canvasAspect > imgAspect) {
    drawHeight = height;
    drawWidth = drawHeight * imgAspect;
  } else {
    drawWidth = width;
    drawHeight = drawWidth / imgAspect;
  }

  let level = amplitude.getLevel();
  tint(150, map(level, 0, 0.1, 150, 255));
  imageMode(CENTER);
  image(bgImg, width / 2, height / 2, drawWidth, drawHeight);
  noTint();

  // --- Capa turquesa detrás ---
  for (let tp of turquoiseParticles) {
    tp.update();
    tp.show();
  }

  let spectrum = fft.analyze();
  let factor = map(level, 0, 0.3, 1, 3);

  for (let p of particles) {
    p.update(factor);
    p.show(spectrum);
  }
}

function playNextSound() {
  sounds[currentSound].play();
  sounds[currentSound].onended(() => {
    currentSound = (currentSound + 1) % sounds.length;
    playNextSound();
  });
}

// ====================
// Clase Particle (principal)
// ====================
class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random3D().mult(random(0.1, 3));
    this.history = [];
    this.lifetime = random(100, 900);
    this.age = 0;
  }

  update(factor) {
    this.pos.add(p5.Vector.mult(this.vel, factor));
    this.age++;

    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;

    this.history.push(this.pos.copy());
    if (this.history.length > trailLength) this.history.shift();

    if (this.age > this.lifetime) {
      this.pos = createVector(random(width), random(height));
      this.vel = p5.Vector.random3D().mult(random(0.4, 5));
      this.history = [];
      this.age = 0;
    }
  }

  show() {
    let c = bgImg.get(
      int(this.pos.x * bgImg.width / width),
      int(this.pos.y * bgImg.height / height)
    );
    let brightnessValue = (red(c) + green(c) + blue(c)) / 3;
    let alphaVal = map(amplitude.getLevel(), 0, 0.3, 80, 200);
    let lineColor = (brightnessValue < 128) ? color(255, alphaVal) : color(0, alphaVal);

    // Líneas entre partículas
    for (let other of particles) {
      if (other !== this) {
        let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        if (d < 140) {
          stroke(lineColor);
          strokeWeight(0.5);
          line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        }
      }
    }

    // Trails
    for (let i = 1; i < this.history.length; i++) {
      let p1 = this.history[i - 1];
      let p2 = this.history[i];

      let bass = fft.getEnergy("bass");
      let w = map(bass, 0, 255, 0.25, 1.5);

      let high = fft.getEnergy("treble");
      let offsetX = map(high, 0, 255, -3, 3);
      let offsetY = map(high, 0, 255, -3, 3);

      stroke(lineColor);
      strokeWeight(w);
      line(p1.x, p1.y, p2.x + offsetX, p2.y + offsetY);
    }
  }
}

// ====================
// Clase TurquoiseParticle
// ====================
class TurquoiseParticle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random3D().mult(3.5);
  }

  update() {
    let angle = noise(this.pos.x * 0.02, this.pos.y * 0.02, frameCount * 0.02) * TWO_PI * 2;
    this.vel = p5.Vector.fromAngle(angle).mult(0.5);
    this.pos.add(this.vel);

    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 2;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 2;
  }

  show() {
    noStroke();
    fill(64, 224, 208, 120);
    ellipse(this.pos.x, this.pos.y, 4, 4);

    for (let other of turquoiseParticles) {
      if (other !== this) {
        let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        if (d < 100) {
          stroke(64, 224, 208, 255);
          strokeWeight(0.3);
          line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        }
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
