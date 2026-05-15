// =========================
// CANVAS SETUP
// =========================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =========================
// UI
// =========================

const ui = document.createElement("div");
ui.style.position = "fixed";
ui.style.top = "10px";
ui.style.left = "10px";
ui.style.color = "white";
ui.style.fontFamily = "Arial";
ui.style.zIndex = 1000;
ui.style.background = "rgba(0,0,0,0.4)";
ui.style.padding = "10px";
ui.style.borderRadius = "10px";
document.body.appendChild(ui);

// restart button
const restartBtn = document.createElement("button");
restartBtn.innerText = "Restart";
ui.appendChild(restartBtn);

// slider speed
const speedLabel = document.createElement("div");
speedLabel.innerText = "Speed";
ui.appendChild(speedLabel);

const speedSlider = document.createElement("input");
speedSlider.type = "range";
speedSlider.min = "0.2";
speedSlider.max = "3";
speedSlider.step = "0.1";
speedSlider.value = "1";
ui.appendChild(speedSlider);

// circle size
const radiusLabel = document.createElement("div");
radiusLabel.innerText = "Circle size";
ui.appendChild(radiusLabel);

const radiusSlider = document.createElement("input");
radiusSlider.type = "range";
radiusSlider.min = "80";
radiusSlider.max = "400";
radiusSlider.step = "10";
radiusSlider.value = "250";
ui.appendChild(radiusSlider);

// counter
const counter = document.createElement("div");
ui.appendChild(counter);

// =========================
// AUDIO (soft plop)
// =========================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function plop() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = 200 + Math.random() * 200;

    gain.gain.value = 0.03;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

// =========================
// WORLD
// =========================

let particles = [];

let circleRadius = 250;

const centerX = () => canvas.width / 2;
const centerY = () => canvas.height / 2;

const MAX_PARTICLES = 400;

// =========================
// TYPES
// =========================

const TYPES = ["normal", "slow", "aggressive", "eater"];

function randomType() {
    const r = Math.random();
    if (r < 0.6) return "normal";
    if (r < 0.75) return "slow";
    if (r < 0.9) return "aggressive";
    return "eater";
}

function typeColor(type) {
    switch (type) {
        case "normal": return "cyan";
        case "slow": return "blue";
        case "aggressive": return "red";
        case "eater": return "magenta";
    }
}

// =========================
// PARTICLE
// =========================

class Particle {
    constructor(x, y, type = randomType()) {
        this.x = x;
        this.y = y;

        this.type = type;

        this.radius = type === "eater" ? 8 : 5;

        const speed = type === "slow" ? 0.5 : 1.5;

        this.vx = (Math.random() - 0.5) * 3 * speed;
        this.vy = (Math.random() - 0.5) * 3 * speed;

        this.cooldown = 0;
    }

    update() {

        const speedFactor = parseFloat(speedSlider.value);

        this.x += this.vx * speedFactor;
        this.y += this.vy * speedFactor;

        if (this.cooldown > 0) this.cooldown--;

        const dx = this.x - centerX();
        const dy = this.y - centerY();

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist + this.radius > circleRadius) {

            const nx = dx / dist;
            const ny = dy / dist;

            const dot = this.vx * nx + this.vy * ny;

            this.vx -= 2 * dot * nx;
            this.vy -= 2 * dot * ny;

            this.x = centerX() + nx * (circleRadius - this.radius);
            this.y = centerY() + ny * (circleRadius - this.radius);
        }
    }

    draw() {

        ctx.shadowBlur = 20;
        ctx.shadowColor = typeColor(this.type);

        ctx.fillStyle = typeColor(this.type);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// =========================
// RESET
// =========================

function reset() {
    particles = [];
}

restartBtn.onclick = reset;

// =========================
// SPAWN
// =========================

canvas.addEventListener("click", (e) => {

    if (particles.length >= 2) return;

    const x = e.clientX;
    const y = e.clientY;

    const dx = x - centerX();
    const dy = y - centerY();

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < circleRadius) {
        particles.push(new Particle(x, y));
    }
});

// =========================
// COLLISIONS
// =========================

function handleCollisions() {

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {

            const a = particles[i];
            const b = particles[j];

            const dx = a.x - b.x;
            const dy = a.y - b.y;

            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < a.radius + b.radius) {

                // eater logic
                if (a.type === "eater" && b.type !== "eater") {
                    particles.splice(j, 1);
                    plop();
                    continue;
                }

                if (b.type === "eater" && a.type !== "eater") {
                    particles.splice(i, 1);
                    plop();
                    continue;
                }

                // spawn logic
                if (
                    a.cooldown === 0 &&
                    b.cooldown === 0 &&
                    particles.length < MAX_PARTICLES
                ) {
                    const childType = Math.random() < 0.5 ? a.type : b.type;

                    particles.push(
                        new Particle(
                            (a.x + b.x) / 2,
                            (a.y + b.y) / 2,
                            childType
                        )
                    );

                    a.cooldown = 25;
                    b.cooldown = 25;

                    plop();
                }

                // bounce
                [a.vx, b.vx] = [b.vx, a.vx];
                [a.vy, b.vy] = [b.vy, a.vy];
            }
        }
    }
}

// =========================
// BACKGROUND (gradient + motion blur)
// =========================

function drawBackground() {

    const g = ctx.createRadialGradient(
        centerX(), centerY(), 50,
        centerX(), centerY(), canvas.width
    );

    g.addColorStop(0, "#05010a");
    g.addColorStop(1, "#000000");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// =========================
// CIRCLE
// =========================

function drawCircle() {

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(centerX(), centerY(), circleRadius, 0, Math.PI * 2);
    ctx.stroke();
}

// =========================
// LOOP
// =========================

function animate() {

    // motion blur
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawCircle();

    for (const p of particles) {
        p.update();
        p.draw();
    }

    handleCollisions();

    counter.innerText = "Particles: " + particles.length;

    circleRadius = parseInt(radiusSlider.value);

    requestAnimationFrame(animate);
}

animate();
