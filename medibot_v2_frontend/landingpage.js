// 1. Initialize AOS (Animations)
AOS.init({ 
    offset: 100, 
    duration: 800, 
    easing: 'ease-out-quad', 
    once: false, 
    mirror: true 
});

// 2. Custom Cursor Logic
const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');

if (cursorDot && cursorOutline) {
    window.addEventListener('mousemove', function (e) {
        const posX = e.clientX;
        const posY = e.clientY;
        
        // Immediate movement for dot
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;
        
        // Animated movement for outline
        cursorOutline.animate({ 
            left: `${posX}px`, 
            top: `${posY}px` 
        }, { duration: 500, fill: "forwards" });
    });
}

// 3. Hover Effects
const interactiveElements = document.querySelectorAll('a, button, input, .process-card, .tech-card, .log-card');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});

// 4. Warp Background Logic
const canvas = document.getElementById('warpCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const stars = Array(500).fill().map(() => ({ 
    x: Math.random() * canvas.width - canvas.width/2, 
    y: Math.random() * canvas.height - canvas.height/2, 
    z: Math.random() * canvas.width 
}));

function animateWarp() {
    ctx.fillStyle = "rgba(2, 6, 23, 0.4)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(s => {
        s.z -= 2; // Speed
        if(s.z <= 0) { 
            s.z = canvas.width; 
            s.x = Math.random() * canvas.width - canvas.width/2; 
            s.y = Math.random() * canvas.height - canvas.height/2; 
        }
        
        const x = (s.x / s.z) * canvas.width + canvas.width/2;
        const y = (s.y / s.z) * canvas.height + canvas.height/2;
        const size = (1 - s.z/canvas.width) * 2;
        
        if(s.z < canvas.width && size > 0) { 
            ctx.beginPath(); 
            ctx.fillStyle = "white"; 
            ctx.arc(x, y, size, 0, Math.PI * 2); 
            ctx.fill(); 
        }
    });
    
    requestAnimationFrame(animateWarp);
}
animateWarp();