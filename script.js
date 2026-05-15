const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];

let circleRadius = 250;

const centerX = () => canvas.width / 2;
const centerY = () => canvas.height / 2;

const MAX_PARTICLES = 500;

// =========================
// UI
// =========================

const ui = document.createElement("div");
ui.style.position = "fixed";
ui.style.top = "10px";
ui.style.left = "10px";
ui.style.zIndex = 9999;
ui.style.background = "rgba(0,0,0,0.5)";
ui.style.color = "white";
ui.style.padding = "10px";
ui.style.borderRadius = "10px";
ui.style.fontFamily = "Arial";
document.body.appendChild(ui);

// restart
const restartBtn = document.createElement("button");
restartBtn.innerText = "Restart";
ui.appendChild(restartBtn);

// speed
ui.appendChild(document.createElement("br"));
ui.appendChild(document.createTextNode("Speed"));

const speedSlider = document.createElement("input");
speedSlider.type = "range";
speedSlider.min = "0.2";
speedSlider.max = "3";
speedSlider.step = "0.1";
speedSlider.value = "1";
ui.appendChild(speedSlider);

// gravity
ui.appendChild(document.createElement("br"));
ui.appendChild(document.createTextNode("Gravity"));

const gravitySlider = document.createElement("input");
gravitySlider.type = "range";
gravitySlider.min = "0";
gravitySlider.max = "0.3";
gravitySlider.step = "0.01";
gravitySlider.value = "0.05";
ui.appendChild(gravitySlider);

// circle size
ui.appendChild(document.createElement("br"));
ui.appendChild(document.createTextNode("Circle"));

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

// restart logic
restartBtn.onclick = () => {
    particles.length = 0;
};

// =========================
// COLORS
// =========================

function randomColor() {
    return {
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255
    };
}

function mixColor(a, b) {
    return {
        r: (a.r + b.r) / 2,
        g: (a.g + b.g) / 2,
        b: (a.b + b.b) / 2
    };
}

function rgb(c) {
    return `rgb(${c.r},${c.g},${c.b})`;
}

// =========================
// PARTICLE
// =========================

class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;

        this.vx = vx;
        this.vy = vy;

        this.radius = 6;

        this.color = color || randomColor();

        this.cooldown = 0;
        this.birthCooldown = 40;
    }

    update() {

        const speedFactor = parseFloat(speedSlider.value);
        const g = parseFloat(gravitySlider.value);

        // speed
        this.x += this.vx * speedFactor;
        this.y += this.vy * speedFactor;

        // gravity toward center
        const dx = centerX() - this.x;
        const dy = centerY() - this.y;

        this.vx += dx * g * 0.001;
        this.vy += dy * g * 0.001;

        if (this.cooldown > 0) this.cooldown--;
        if (this.birthCooldown > 0) this.birthCooldown--;

        const rx = this.x - centerX();
        const ry = this.y - centerY();

        const dist = Math.sqrt(rx * rx + ry * ry);

        if (dist + this.radius > circleRadius) {

            const nx = rx / dist;
            const ny = ry / dist;

            const dot = this.vx * nx + this.vy * ny;

            this.vx -= 2 * dot * nx;
            this.vy -= 2 * dot * ny;

            this.x = centerX() + nx * (circleRadius - this.radius);
            this.y = centerY() + ny * (circleRadius - this.radius);
        }
    }

    draw() {

        ctx.shadowBlur = 15;
        ctx.shadowColor = rgb(this.color);

        ctx.fillStyle = rgb(this.color);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

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

        particles.push(
            new Particle(
                x,
                y,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
            )
        );
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

            const dx = b.x - a.x;
            const dy = b.y - a.y;

            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < a.radius + b.radius) {

                if (
                    a.cooldown === 0 &&
                    b.cooldown === 0 &&
                    a.birthCooldown === 0 &&
                    b.birthCooldown === 0 &&
                    particles.length < MAX_PARTICLES
                ) {

                    // perpendicular spawn direction
                    const nx = dx / dist;
                    const ny = dy / dist;

                    const px = -ny;
                    const py = nx;

                    const speed = 2 + Math.random() * 2;

                    const vx = px * speed;
                    const vy = py * speed;

                    const childColor = mixColor(a.color, b.color);

                    particles.push(
                        new Particle(
                            (a.x + b.x) / 2,
                            (a.y + b.y) / 2,
                            vx,
                            vy,
                            childColor
                        )
                    );

                    a.cooldown = 25;
                    b.cooldown = 25;
                }

                // bounce
                [a.vx, b.vx] = [b.vx, a.vx];
                [a.vy, b.vy] = [b.vy, a.vy];
            }
        }
    }
}

// =========================
// LOOP
// =========================

function drawCircle() {

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(centerX(), centerY(), circleRadius, 0, Math.PI * 2);
    ctx.stroke();
}

function animate() {

    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    circleRadius = parseInt(radiusSlider.value);

    drawCircle();

    for (const p of particles) {
        p.update();
        p.draw();
    }

    handleCollisions();

    counter.innerText = `Particles: ${particles.length}`;

    requestAnimationFrame(animate);
}

animate();
