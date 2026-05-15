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
// PARTICLE
// =========================

class Particle {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;

        this.radius = 6;

        this.vx = vx;
        this.vy = vy;

        this.cooldown = 0;

        this.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
    }

    update() {

        this.x += this.vx;
        this.y += this.vy;

        if (this.cooldown > 0) this.cooldown--;

        const dx = this.x - centerX();
        const dy = this.y - centerY();

        const dist = Math.sqrt(dx * dx + dy * dy);

        // bounce on circle
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
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;

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

        // стартовая случайная скорость
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

                if (
                    a.cooldown === 0 &&
                    b.cooldown === 0 &&
                    particles.length < MAX_PARTICLES
                ) {

                    // нормализованный вектор между родителями
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // ПЕРПЕНДИКУЛЯР
                    const px = -ny;
                    const py = nx;

                    const speed = 2 + Math.random() * 2;

                    const vx = px * speed;
                    const vy = py * speed;

                    const newX = (a.x + b.x) / 2;
                    const newY = (a.y + b.y) / 2;

                    particles.push(
                        new Particle(newX, newY, vx, vy)
                    );

                    a.cooldown = 20;
                    b.cooldown = 20;
                }

                // лёгкий bounce
                [a.vx, b.vx] = [b.vx, a.vx];
                [a.vy, b.vy] = [b.vy, a.vy];
            }
        }
    }
}

// =========================
// DRAW CIRCLE
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

    // motion blur
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
