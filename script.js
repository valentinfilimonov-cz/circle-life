const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];

const MAX_PARTICLES = 400;

let circleRadius = 250;

const centerX = () => canvas.width / 2;
const centerY = () => canvas.height / 2;

// =========================
// COLORS
// =========================

function randomColor() {
    return {
        r: Math.floor(Math.random() * 255),
        g: Math.floor(Math.random() * 255),
        b: Math.floor(Math.random() * 255)
    };
}

function mixColor(c1, c2) {
    return {
        r: Math.floor((c1.r + c2.r) / 2),
        g: Math.floor((c1.g + c2.g) / 2),
        b: Math.floor((c1.b + c2.b) / 2)
    };
}

function toRGB(c) {
    return `rgb(${c.r},${c.g},${c.b})`;
}

// =========================
// PARTICLE
// =========================

class Particle {
    constructor(x, y, vx, vy, color) {

        this.x = x;
        this.y = y;

        this.radius = 6;

        this.vx = vx;
        this.vy = vy;

        this.color = color || randomColor();

        // cooldown между размножением
        this.cooldown = 0;

        // 🔥 ИММУНИТЕТ ПОСЛЕ РОЖДЕНИЯ
        this.birthCooldown = 30;
    }

    update() {

        this.x += this.vx;
        this.y += this.vy;

        if (this.cooldown > 0) this.cooldown--;
        if (this.birthCooldown > 0) this.birthCooldown--;

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

        ctx.shadowBlur = 15;
        ctx.shadowColor = toRGB(this.color);

        ctx.fillStyle = toRGB(this.color);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// =========================
// SPAWN FIRST 2
// =========================

canvas.addEventListener("click", (e) => {

    if (particles.length >= 2) return;

    const x = e.clientX;
    const y = e.clientY;

    const dx = x - centerX();
    const dy = y - centerY();

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < circleRadius) {

        const vx = (Math.random() - 0.5) * 3;
        const vy = (Math.random() - 0.5) * 3;

        particles.push(new Particle(x, y, vx, vy));
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

                // ❌ нельзя размножаться если:
                // - только родился
                if (
                    a.cooldown === 0 &&
                    b.cooldown === 0 &&
                    a.birthCooldown === 0 &&
                    b.birthCooldown === 0 &&
                    particles.length < MAX_PARTICLES
                ) {

                    // направление между ними
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // перпендикуляр
                    const px = -ny;
                    const py = nx;

                    const speed = 2 + Math.random() * 2;

                    const vx = px * speed;
                    const vy = py * speed;

                    const newX = (a.x + b.x) / 2;
                    const newY = (a.y + b.y) / 2;

                    // 🔥 МИКС ЦВЕТОВ
                    const childColor = mixColor(a.color, b.color);

                    particles.push(
                        new Particle(newX, newY, vx, vy, childColor)
                    );

                    a.cooldown = 20;
                    b.cooldown = 20;
                }

                // bounce
                [a.vx, b.vx] = [b.vx, a.vx];
                [a.vy, b.vy] = [b.vy, a.vy];
            }
        }
    }
}

// =========================
// DRAW
// =========================

function drawCircle() {

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(centerX(), centerY(), circleRadius, 0, Math.PI * 2);
    ctx.stroke();
}

// =========================
// LOOP
// =========================

function animate() {

    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawCircle();

    for (const p of particles) {
        p.update();
        p.draw();
    }

    handleCollisions();

    requestAnimationFrame(animate);
}

animate();
