let particles = [];
let maxParticles = 200;
let trailLength = 55;
let fft, amplitude;
let sounds = [];
let currentSound = 0;
let bgImg;
let canvas; // <--- aquí declaras la variable canvas
let level;
function preload() {
  // Carga los sonidos
  sounds[0] = loadSound('assets1/audio/2.wav', 
    () => console.log("Audio 1 cargado"), 
    (err) => console.error("Error cargando audio 1:", err)
  );
  sounds[1] = loadSound('assets1/audio/4.wav', 
    () => console.log("Audio 2 cargado"), 
    (err) => console.error("Error cargando audio 2:", err)
  );

  // Carga el fondo según orientación
  if (windowWidth > windowHeight) {
    bgImg = loadImage('assets1/fotos/FONDO1.png',
      () => console.log("Fondo horizontal cargado"),
      (err) => console.error("Error cargando fondo horizontal:", err)
    );
  } else {
    bgImg = loadImage('assets1/fotos/FONDO1_vertical.png',
      () => console.log("Fondo vertical cargado"),
      (err) => console.error("Error cargando fondo vertical:", err)
    );
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');
  canvas.style('position', 'fixed');

  // Inicializa audio en navegadores modernos
  userStartAudio();

  fft = new p5.FFT(0.9, 1024);
  amplitude = new p5.Amplitude();

  playNextSound();

  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  strokeWeight(0.4);
}

function draw() {
  background(0); // negro de base

  // Calcula proporciones
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

  // Nivel de audio para opacidad dinámica
  let level = amplitude.getLevel();
  tint(150, map(level, 0, 0.3, 150, 150)); // entre 150 y 255

  // Dibuja imagen centrada
  imageMode(CENTER);
  image(bgImg, width / 2, height / 2, drawWidth, drawHeight);
  noTint(); // importante: partículas no se ven afectadas

  // Analiza audio para partículas
  let spectrum = fft.analyze();
  let factor = map(level, 0, 0.3, 0.5, 3);

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

// Clase Particle
class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D().mult(random(0.3, 2));
    this.history = [];
    this.lifetime = random(250, 600);
    this.age = 0;
  }

  update(factor) {
    this.pos.add(p5.Vector.mult(this.vel, factor));
    this.age++;

    // Rebote en bordes
    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;

    // Guardar historial para trails
    this.history.push(this.pos.copy());
    if (this.history.length > trailLength) this.history.shift();

    // Resetear si muere
    if (this.age > this.lifetime) {
      this.pos = createVector(random(width), random(height));
      this.vel = p5.Vector.random2D().mult(random(0.5, 2));
      this.history = [];
      this.age = 0;
    }
  }

  show(spectrum) {
    // energías (pueden seguir afectando grosor, velocidad, etc.)
  let bass = fft.getEnergy("bass");
let mid = fft.getEnergy("mid");
let high = fft.getEnergy("treble"); // agudos

let gray = map(mid, 0, 255, 100, 255);    // gris para líneas
let alpha = map(bass, 0, 255, 50, 180);   // opacidad
let blue = map(high, 0, 255, 50, 255);    // azul para un toque treble

// Líneas entre partículas
for (let other of particles) {
  if (other !== this) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    if (d < 140) {
      stroke(gray, alpha, blue); // mezcla gris y azul con opacidad
      line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);

      // destellos/minitrazos reactivos
      if (random(1) < 0.08) {
        let steps = int(random(2, 5));
        for (let i = 0; i < steps; i++) {
          let t = random(0.2, 0.8);
          let midX = lerp(this.pos.x, other.pos.x, t);
          let midY = lerp(this.pos.y, other.pos.y, t);
          let offsetX = random(-3, 3);
          let offsetY = random(-3, 3);
          stroke(255, map(high,0,255,100,255)); // brillo de destello según treble
          line(midX, midY, midX + offsetX, midY + offsetY);
        }
      }
    }
  }
}
    // Trails de la partícula
    for (let i = 1; i < this.history.length; i++) {
      let p1 = this.history[i - 1];
      let p2 = this.history[i];
      stroke(gray, map(i, 0, trailLength, 0, 180));
      line(p1.x, p1.y, p2.x, p2.y);
    }
  }
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
