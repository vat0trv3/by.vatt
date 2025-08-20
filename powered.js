        let lastMouseX = -1;
let lastMouseY = -1;
let mySound;
let myFont;
let myVideo;
let headlineText = "VaTOTRVE";
let subheadlineText = "poweredbyvatt";
let textSizeMain, textSizeSub, textSizeCorner, textSizeSmall;
let fadingOut = false; // ¿Estamos haciendo fade out?
let alphaFade = 0;     
let fadeSpeed = 5;     // Qué tan rápido se hace el fade
let targetURL = "";
// --- BOTÓN DE AUDIO ---
let audioButtonX;
let audioButtonY;
let audioButtonSize = 50;
let isAudioPlaying = false;
let isAudioStarted = false;
let buttonParticles = [];
const NUM_BUTTON_PARTICLES = 200;
const BPM = 111;
const BEAT_INTERVAL = (55.8/ BPM) * 1000;
const FOUR_BEATS_IN_FRAMES = Math.round(60 * (BEAT_INTERVAL / 1000) * 4);
const anticipationOffset = 5;
let beatPulse = 0;

// --- BOTÓN GO IN ---
let goInButtonX;
let goInButtonY;
let goInButtonSize = 50;
let goInParticles = [];
const NUM_GO_IN_PARTICLES = 200;


// ===========================================
// 2. DEFINICIÓN DE CLASES
// ===========================================
class ButtonParticle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = random(audioButtonX - audioButtonSize / 2, audioButtonX + audioButtonSize / 2);
        this.y = random(audioButtonY - audioButtonSize / 2, audioButtonY + audioButtonSize / 2);
        this.originalX = this.x;
        this.originalY = this.y;
        this.size = random(0.1, 3);
        this.life = random(200, 500);
        this.maxLife = this.life;
        this.velocity = createVector(random(-2, 2), random(-2, 2));
    }

    update() {
        this.life--;
        if (this.life <= 0) {
            this.reset();
        }

        if (isAudioPlaying) {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            
            if (this.x < 0 || this.x > width) this.velocity.x *= -1;
            if (this.y < 0 || this.y > height) this.velocity.y *= -1;
        } else {
            let angle = atan2(this.y - audioButtonY, this.x - audioButtonX);
            let d = dist(this.x, this.y, audioButtonX, audioButtonY);
            let force = map(d, 0, audioButtonSize, -0.5, -2);
            this.x += cos(angle) * force;
            this.y += sin(angle) * force;
        }

        this.alpha = map(this.life, 0, this.maxLife, 0, 200);
    }

    show() {
        stroke(255, 0, 255, this.alpha);
        strokeWeight(this.size);
        point(this.x, this.y);
    }
}

class GoInButtonParticle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = random(goInButtonX - goInButtonSize / 2, goInButtonX + goInButtonSize / 2);
        this.y = random(goInButtonY - goInButtonSize / 2, goInButtonY + goInButtonSize / 2);
        this.originalX = this.x;
        this.originalY = this.y;
        this.size = random(0.3, 3);
        this.life = random(50, 200);
        this.maxLife = this.life;
    }

    update() {
        this.life--;
        if (this.life <= 0) {
            this.reset();
        }

        let angle = atan2(this.y - goInButtonY, this.x - goInButtonX);
        let d = dist(this.x, this.y, goInButtonX, goInButtonY);
        let force = map(d, 0, goInButtonSize, -0.2, -1.5);

        let vortexSpeed = map(d, 0, goInButtonSize, 0.3, 0.05);
        this.x += cos(angle - frameCount * vortexSpeed) * force;
        this.y += sin(angle - frameCount * vortexSpeed) * force;

        this.alpha = map(this.life, 0, this.maxLife, 0, 150);
    }

    show() {
        stroke(64, 224, 208, this.alpha);
        strokeWeight(this.size);
        point(this.x, this.y);
    }
}


// ===========================================
// 3. FUNCIONES PRINCIPALES DE P5.JS
// ===========================================
function preload() {
    mySound = loadSound('assets/audio/cancion.m4a');
    myFont = loadFont('assets/fuentes/neutro.ttf');

    myVideo = createVideo(['assets/video/mi-video.mp4']);
    myVideo.elt.muted = true;
    myVideo.elt.playsinline = true;
    myVideo.hide();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);

    textSizeMain = width * 0.12;
    textSizeSub = width * 0.04;
    textSizeCorner = width * 0.02;
    textSizeSmall = width * 0.025;

    myVideo.loop();
    myVideo.volume(0);

    audioButtonX = width * 0.1;
    audioButtonY = height * 0.9;
    for (let i = 0; i < NUM_BUTTON_PARTICLES; i++) {
        buttonParticles.push(new ButtonParticle());
    }

    goInButtonX = width * 0.9;
    goInButtonY = height * 0.9;
    for (let i = 0; i < NUM_GO_IN_PARTICLES; i++) {
        goInParticles.push(new GoInButtonParticle());
    }
}

function draw() {
    let mouseIsMoving = (abs(mouseX - lastMouseX) > 0.1 || abs(mouseY - lastMouseY) > 0.1);

    if (!mouseIsMoving) {
        background(0);
    } else {
        noStroke();
        fill(0, 80);
        rect(0, 0, width, height);
    }
    
    image(myVideo, 0, 0, width, height);
    
    drawBackgroundWaves();
    drawBackgroundGrid();
    
    if (isAudioPlaying) {
        if ((frameCount + anticipationOffset) % FOUR_BEATS_IN_FRAMES === 0) {
            beatPulse = 255;
        }
        beatPulse = max(0, beatPulse - 15);
        drawInterconnectingLines();
    }
    
    drawTextElements();textAlign(CENTER, CENTER);
    textSize(10); // pequeño y discreto
    fill(255, 0, 255, 180); // algo translúcido
    noStroke();
    let buttonText = isAudioPlaying ? "STOP" : "PLAY";
    text(buttonText, audioButtonX, audioButtonY);
    
    if (mouseIsMoving) {
        drawInteractiveShapes();
    }
    
    drawAudioButton();
    drawGoInButton();

    lastMouseX = mouseX;
    lastMouseY = mouseY;
}



// ============================================
// 4. MANEJO DE INTERACCIONES
// ============================================
function mousePressed() {
    handleInteraction();
}

function touchStarted() {
    handleInteraction();
    return false; // Previene zoom o scroll en el navegador móvil
}

function handleInteraction() {
    let dAudio = dist(mouseX, mouseY, audioButtonX, audioButtonY);
    if (dAudio < audioButtonSize / 2) {
        if (!isAudioStarted) {
            getAudioContext().resume();
            mySound.loop();
            myVideo.elt.muted = false;
            myVideo.volume(1);
            isAudioPlaying = true;
            isAudioStarted = true;
        } else {
            if (isAudioPlaying) {
                mySound.pause();
                isAudioPlaying = false;
                resetAudioParticles();
            } else {
                mySound.loop();
                isAudioPlaying = true;
            }
        }
    }

    let dGoIn = dist(mouseX, mouseY, goInButtonX, goInButtonY);
    if (dGoIn < goInButtonSize / 2) {
        window.location.href = 'https://editor.p5js.org/vat0trv3/full/A4YiVnT2h';
      fadingOut = true;
    }
}


// ===========================================
// 5. FUNCIONES AUXILIARES DE DIBUJO
// ===========================================
function resetAudioParticles() {
    for (let p of buttonParticles) {
        p.reset();
    }
}

function drawInterconnectingLines() {
    push();
    noFill();
    let lineAlpha = beatPulse;
    stroke(150, 150, 150, lineAlpha);
    strokeWeight(map(beatPulse, 0, 255, 0.2, 0.2));
    for (let i = 0; i < buttonParticles.length; i++) {
        for (let j = i + 1; j < buttonParticles.length; j++) {
            let p1 = buttonParticles[i];
            let p2 = buttonParticles[j];
            let d = dist(p1.x, p1.y, p2.x, p2.y);
            if (d < width * 0.1) {
                line(p1.x, p1.y, p2.x, p2.y);
            }
        }
    }
    pop();
}

function drawAudioButton() {
    push();
    noFill();
    stroke(255, 0, 255, 50);
    strokeWeight(1.5);
    ellipse(audioButtonX, audioButtonY, audioButtonSize, audioButtonSize);
    pop();
    for (let p of buttonParticles) {
        p.update();
        p.show();
    }
}

function drawGoInButton() {
    push();
    noFill();
    stroke(64, 224, 208, 50);
    strokeWeight(1.5);
    ellipse(goInButtonX, goInButtonY, goInButtonSize, goInButtonSize);
    fill(64, 224, 208, 150);
    textSize(12);
    textAlign(CENTER, CENTER);
    let textRadius = goInButtonSize / 2 + 10;
    let textToDraw = "GOIN";
    let totalAngle = PI;
    let angleIncrement = TWO_PI / textToDraw.length;
    for (let i = 0; i < textToDraw.length; i++) {
        let angle = totalAngle + angleIncrement * i;
        let x = goInButtonX + cos(angle) * textRadius;
        let y = goInButtonY + sin(angle) * textRadius;
        push();
        translate(x, y);
        rotate(angle + PI / 2);
        text(textToDraw.charAt(i), 0, 0);
        pop();
    }
    pop();
    for (let p of goInParticles) {
        p.update();
        p.show();
    }
}

function drawBackgroundGrid() {
    push();
    stroke(20, 20, 20, 200);
    strokeWeight(0.5);
    for (let y = 0; y < height; y += 50) {
        line(0, y, width, y);
    }
    for (let x = 0; x < width; x += 50) {
        line(x, 0, x, height);
    }
    pop();
}

function drawInteractiveShapes() {
    push();
    blendMode(ADD);
    noFill();
    strokeWeight(1.5);
    const baseTurquoise = color(64, 224, 208);
    const baseWhite = color(255);
    let currentColor = random() < 0.5 ?
        color(baseTurquoise.levels[0], baseTurquoise.levels[1], baseTurquoise.levels[2], random(100, 255)) :
        color(baseWhite.levels[0], baseWhite.levels[1], baseWhite.levels[2], random(100, 255));
    stroke(currentColor);
    let formSize = random(10, 40);
    let offsetX = random(-15, 15);
    let offsetY = random(-15, 15);
    push();
    translate(mouseX + offsetX, mouseY + offsetY);
    rotate(radians(random(-10, 10)));
    rectMode(CENTER);
    if (random() < 0.6) {
        rect(0, 0, formSize, formSize);
    } else {
        rect(0, 0, formSize * random(0.5, 2), formSize * random(0.5, 2));
    }
    pop();
    if (frameCount % 3 === 0) {
        strokeWeight(0.8);
        currentColor = random() < 0.5 ?
            color(baseTurquoise.levels[0], baseTurquoise.levels[1], baseTurquoise.levels[2], random(50, 180)) :
            color(baseWhite.levels[0], baseWhite.levels[1], baseWhite.levels[2], random(50, 180));
        stroke(currentColor);
        let secondFormSize = random(8, 33);
        let secondOffsetX = random(-8, 10);
        let secondOffsetY = random(-5, 10);
        push();
        translate(mouseX + secondOffsetX, mouseY + secondOffsetY);
        rotate(radians(random(-10, 10)));
        rectMode(CENTER);
        if (random() < 0.6) {
            rect(0, 0, secondFormSize, secondFormSize);
        } else {
            rect(0, 0, secondFormSize * random(0.5, 2), secondFormSize * random(0.5, 2));
        }
        pop();
    }
    pop();
    blendMode(BLEND);
}

function drawTextElements() {
    push();
    textAlign(CENTER, CENTER);
    textFont(myFont);
    textSize(textSizeMain);
    let alphaMain = map(sin(frameCount * 0.05), -1, 1, 150, 255);
    fill(255, 255, 255, alphaMain);
    noStroke();
    text(headlineText, width / 2, height * 0.45);
    textSize(textSizeSub);
    let alphaSub = map(sin(frameCount * 0.08 + PI), -1, 1, 100, 200);
    fill(64, 224, 208, alphaSub);
    let subheadlineX = width / 2;
    let subheadlineY = height * 0.6;
    text(subheadlineText, subheadlineX, subheadlineY);
    let subheadlineWidth = textWidth(subheadlineText);
    let horizontalOffset = width * 0.02;
    let sideTextY = subheadlineY;
    let reducedSize = textSizeSmall * 0.65;
    textFont('Arial');
    textSize(reducedSize);
    fill(255, 0, 255);
    let audioX = subheadlineX - subheadlineWidth / 2 - horizontalOffset - textWidth("AUDIO") / 2;
    push();
    translate(audioX, sideTextY);
    text("AUDIO", 0, 0);
    pop();
    let visualX = subheadlineX + subheadlineWidth / 2 + horizontalOffset + textWidth("VISUAL") / 2;
    push();
    translate(visualX, sideTextY);
    text("VISUAL", 0, 0);
    pop();
    pop();
    textFont('Verdana');
    textSize(textSizeCorner);
    let alphaCorner = map(sin(frameCount * 0.15), -1, 1, 80, 150);
    fill(255, 255, 255, alphaCorner);
    text("INFINITTE-POSSIBLE", width * 0.40, height * 0.95);
}

function drawBackgroundWaves() {
    push();
    noStroke();
    for (let i = 0; i < width; i += 2) {
        let yOffset = sin(frameCount * 0.01 + i * 0.02) * 50;
        let xOffset = cos(frameCount * 0.01 + i * 0.02) * 2;
        let waveX = i + xOffset;
        let waveY = height / 2 + yOffset;
        waveY = constrain(waveY, 0, height);
        let alpha = map(waveY, 0, height, 10, 50);
        fill(200, 200, 200, alpha);
        let particleSize = map(sin(i * 0.01 + frameCount * 0.02), -1, 1, 1, 3);
        ellipse(waveX, waveY, particleSize, particleSize);
    }
    pop();
}
