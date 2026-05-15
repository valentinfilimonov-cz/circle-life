const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const circleRadius = 250;

const particles = [];

const MAX_PARTICLES = 300;

// =========================
// ЦВЕТА
// =========================

function randomColor() {

    return {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
    };
}

function mixColors(c1, c2) {

    return {
        r: Math.floor((c1.r + c2.r) / 2),
        g: Math.floor((c1.g + c2.g) / 2),
        b: Math.floor((c1.b + c2.b) / 2)
    };
}

function colorToString(color) {

    return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

// =========================
// ЧАСТИЦА
// =========================

class Particle {

    constructor(x, y, color = randomColor()) {

        this.x = x;
        this.y = y;

        this.radius = 6;

        this.color = color;

        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;

        // задержка между размножениями
        this.cooldown = 0;
    }

    update() {

        this.x += this.vx;
        this.y += this.vy;

        // уменьшаем cooldown
        if (this.cooldown > 0) {
            this.cooldown--;
        }

        const dx = this.x - centerX;
        const dy = this.y - centerY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        // столкновение со стенкой круга
        if (distance + this.radius > circleRadius) {

            const nx = dx / distance;
            const ny = dy / distance;

            const dot = this.vx * nx + this.vy * ny;

            this.vx -= 2 * dot * nx;
            this.vy -= 2 * dot * ny;

            this.x = centerX + nx * (circleRadius - this.radius);
            this.y = centerY + ny * (circleRadius - this.radius);
        }
    }

    draw() {

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );

        // glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = colorToString(this.color);

        ctx.fillStyle = colorToString(this.color);

        ctx.fill();
    }
}

// =========================
// КЛИКИ
// =========================

canvas.addEventListener("click", (event) => {

    // только 2 стартовых шарика
    if (particles.length >= 2) return;

    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const dx = x - centerX;
    const dy = y - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    // только внутри круга
    if (distance <= circleRadius) {

        particles.push(
            new Particle(x, y)
        );
    }
});

// =========================
// СТОЛКНОВЕНИЯ
// =========================

function handleCollisions() {

    for (let i = 0; i < particles.length; i++) {

        for (let j = i + 1; j < particles.length; j++) {

            const a = particles[i];
            const b = particles[j];

            const dx = a.x - b.x;
            const dy = a.y - b.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            // столкновение
            if (distance < a.radius + b.radius) {

                // размножение
                if (
                    a.cooldown <= 0 &&
                    b.cooldown <= 0 &&
                    particles.length < MAX_PARTICLES
                ) {

                    const newX = (a.x + b.x) / 2;
                    const newY = (a.y + b.y) / 2;

                    // смешиваем цвета
                    const childColor = mixColors(
                        a.color,
                        b.color
                    );

                    particles.push(
                        new Particle(
                            newX,
                            newY,
                            childColor
                        )
                    );

                    // cooldown
                    a.cooldown = 30;
                    b.cooldown = 30;
                }

                // простой физический отскок
                const tempVx = a.vx;
                const tempVy = a.vy;

                a.vx = b.vx;
                a.vy = b.vy;

                b.vx = tempVx;
                b.vy = tempVy;
            }
        }
    }
}

// =========================
// КРУГ
// =========================

function drawCircle() {

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        circleRadius,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;

    ctx.shadowBlur = 0;

    ctx.stroke();
}

// =========================
// АНИМАЦИЯ
// =========================

function animate() {

    // trails
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawCircle();

    particles.forEach((particle) => {

        particle.update();
        particle.draw();
    });

    handleCollisions();

    requestAnimationFrame(animate);
}

// старт
animate();
