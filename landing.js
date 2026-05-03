/* =============================================
   SMARTHOME AI — Landing Page JavaScript
   ============================================= */

// ── Mobile Navigation Toggle ──────────────────
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// ── Smooth Scroll for Anchor Links ───────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ── Navbar Background on Scroll ───────────────
const nav = document.querySelector('.nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        nav.style.background = 'rgba(26, 46, 51, 0.98)';
        nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
        nav.style.background = 'rgba(26, 46, 51, 0.95)';
        nav.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// ── Intersection Observer for Animations ──────
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.feature-card, .about-card, .device-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ── Stats Counter Animation ───────────────────
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + '+';
        }
    }, 16);
};

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            if (statNumber && !statNumber.classList.contains('animated')) {
                statNumber.classList.add('animated');
                const text = statNumber.textContent;
                const number = parseInt(text);
                if (!isNaN(number)) {
                    animateCounter(statNumber, number);
                }
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});

// ── Parallax Effect for Hero Orbs ─────────────
window.addEventListener('mousemove', (e) => {
    const orbs = document.querySelectorAll('.gradient-orb');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 20;
        const xMove = (x - 0.5) * speed;
        const yMove = (y - 0.5) * speed;
        orb.style.transform = `translate(${xMove}px, ${yMove}px)`;
    });
});

// ── Device Cards Hover Effect ─────────────────
document.querySelectorAll('.device-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px) scale(1.05)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// ── Initialize Lucide Icons ───────────────────
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// ── Console Welcome Message ───────────────────
console.log('%c🏠 SmartHome AI', 'font-size: 24px; font-weight: bold; color: #6c63ff;');
console.log('%cWelcome to the future of home automation!', 'font-size: 14px; color: #00d4b4;');
console.log('%cBuilt with ❤️ using Flask, JavaScript, and AI', 'font-size: 12px; color: #a0aec0;');

// ── Dashboard Link Transition ─────────────────
document.querySelectorAll('a[href="dashboard.html"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Set flag to allow dashboard access
        sessionStorage.setItem('fromLanding', 'true');
        
        // Create transition overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, #2E5961 0%, #55A9A8 100%);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const icon = document.createElement('div');
        icon.innerHTML = '<i data-lucide="home" style="width: 60px; height: 60px; color: white;"></i>';
        icon.style.cssText = 'animation: spin 1s linear infinite;';
        overlay.appendChild(icon);
        
        document.body.appendChild(overlay);
        
        // Add spin animation
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        
        // Initialize icon
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Fade in overlay
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // Navigate after animation
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 600);
    });
});

// ── Button Particle Effect ────────────────────
document.querySelectorAll('.btn-white, .btn-primary').forEach(button => {
    button.addEventListener('mouseenter', function(e) {
        const rect = this.getBoundingClientRect();
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: white;
                border-radius: 50%;
                pointer-events: none;
                left: ${Math.random() * rect.width}px;
                top: ${Math.random() * rect.height}px;
                animation: particleFade 1s ease-out forwards;
            `;
            
            this.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    });
});

// Add particle animation
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes particleFade {
        0% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-20px) scale(0);
        }
    }
`;
document.head.appendChild(particleStyle);
