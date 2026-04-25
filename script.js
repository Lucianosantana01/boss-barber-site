// Smooth scrolling for navigation links - sempre alinhado abaixo do header
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.hasAttribute('data-tab')) return;
        document.querySelector('.nav')?.classList.remove('active');
        
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#' || !targetId) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        const target = document.querySelector(targetId);
        if (!target) return;
        
        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 90;
        const extraPadding = ['#sobre', '#galeria', '#depoimentos'].includes(targetId) ? 0 : 20;
        // Sobre: 50% | Galeria: 30% | Depoimentos: 20% mais para cima
        let offset = headerHeight + extraPadding;
        if (targetId === '#sobre') offset = headerHeight * 0.5;
        else if (targetId === '#galeria') offset = headerHeight * 0.5;
        else if (targetId === '#depoimentos') offset = headerHeight * 0.2;
        
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const scrollToPosition = targetId === '#home' ? 0 : Math.max(0, targetPosition - offset);
        
        window.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth'
        });
        
        let checkCount = 0;
        const checkInterval = setInterval(() => {
            checkHeaderPosition();
            if (++checkCount >= 15) clearInterval(checkInterval);
        }, 100);
    });
});

// Add scroll effect to header
let lastScroll = 0;
const header = document.querySelector('.header');

// Check if we're at the top on page load
function checkHeaderPosition() {
    const currentScroll = window.pageYOffset;
    
    // Check if we're over a hero section (only visible ones)
    const heroes = document.querySelectorAll('.hero, .service-hero');
    let overHero = false;
    
    heroes.forEach(hero => {
        // Check if hero is visible (not hidden by parent)
        const parentTab = hero.closest('.service-tab-content');
        const isVisible = !parentTab || parentTab.classList.contains('active') || hero.closest('.hero-slider');
        
        if (isVisible) {
            const rect = hero.getBoundingClientRect();
            // Check if header is overlapping with hero section
            // Header is typically around 100px tall, so check if hero overlaps that area
            if (rect.top <= 120 && rect.bottom > 80) {
                overHero = true;
            }
        }
    });
    
    // If we're over a hero section, keep header transparent
    // Otherwise, add background after scrolling 50px
    if (overHero) {
        header.classList.remove('scrolled');
    } else if (currentScroll > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// Check on load
checkHeaderPosition();

// Check on scroll
window.addEventListener('scroll', () => {
    checkHeaderPosition();
    lastScroll = window.pageYOffset;
});

// Check on resize
window.addEventListener('resize', () => {
    checkHeaderPosition();
});

// Check when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    checkHeaderPosition();
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.service-card, .service-card-dark, .testimonial-card, .blog-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(card);
});

// Mobile menu toggle
const createMobileMenu = () => {
    const nav = document.querySelector('.nav');
    const container = document.querySelector('.header .container');

    // Remove existing button if any to avoid duplicates
    const existing = container.querySelector('.mobile-menu-btn');
    if (existing) existing.remove();

    if (window.innerWidth <= 768) {
        const menuBtn = document.createElement('button');
        menuBtn.classList.add('mobile-menu-btn');
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        container.insertBefore(menuBtn, nav);

        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    } else {
        nav.classList.remove('active');
    }
};

// Call on load and resize
window.addEventListener('load', createMobileMenu);
window.addEventListener('resize', createMobileMenu);

// Add active state to navigation based on scroll position
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav a[href^="#"]');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Service Tabs Functionality (Feel King style)
const serviceCategoryTags = document.querySelectorAll('.service-category-tag');
const serviceCategoryBlocks = document.querySelectorAll('.service-category-block');

serviceCategoryTags.forEach(tag => {
    tag.addEventListener('click', () => {
        const category = tag.dataset.category;
        
        serviceCategoryTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        
        serviceCategoryBlocks.forEach(block => block.classList.remove('active'));
        const selectedBlock = document.querySelector(`.service-category-block[data-content="${category}"]`);
        if (selectedBlock) {
            selectedBlock.classList.add('active');
        }
    });
});

// Hero Slider Functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.hero');
const dots = document.querySelectorAll('.dot');
const totalSlides = slides.length;

function showSlide(index) {
    // Remove active class from all slides and dots
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Add active class to current slide and dot (instant change)
    slides[index].classList.add('active');
    dots[index].classList.add('active');
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    showSlide(currentSlide);
}

// Arrow button events
document.querySelector('.slider-next').addEventListener('click', nextSlide);
document.querySelector('.slider-prev').addEventListener('click', prevSlide);

// Dot navigation
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentSlide = index;
        showSlide(currentSlide);
    });
});

// Auto-play slider (optional - every 5 seconds)
setInterval(nextSlide, 5000);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Sistema de Agendamento e WhatsApp
const whatsappNumber = '5519991597431';
const agendamentoUrl = 'https://agendamentos.bestbarbers.app/barbershop/bossbarber';
const whatsappMessageDefault = `Olá, tudo bem? 

Vim pelo site da Boss Barber e gostaria de agendar um horário.`.trim();
const whatsappMessageConsultoriaVisagismo = `Olá, tudo bem?

Vim pelo site da Boss Barber e gostaria de agendar uma consultoria de visagismo. Pode me informar os horários disponíveis?`.trim();

function getActiveServiceTab() {
    const active = document.querySelector('.service-tab-content.active');
    return active ? active.getAttribute('data-content') : null;
}

function getWhatsappMessageForContext(el) {
    const mode = (el.getAttribute('data-wa') || '').trim();
    if (mode === 'consult' || mode === 'visagista' || mode === 'consultoria') {
        return whatsappMessageConsultoriaVisagismo;
    }

    // float button: muda automaticamente se o usuário estiver na aba "Consultoria Visagista"
    if (el.classList.contains('whatsapp-float')) {
        if (getActiveServiceTab() === 'visagista') {
            return whatsappMessageConsultoriaVisagismo;
        }
        return whatsappMessageDefault;
    }

    return whatsappMessageDefault;
}

// Botões de agendamento direcionam para o sistema
document.querySelectorAll('.btn-primary, .btn-secondary, .btn-service-agendar').forEach(btn => {
    if (btn.textContent.includes('Agendar') || btn.textContent.includes('Agende')) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(agendamentoUrl, '_blank');
        });
    }
});

// Botões de WhatsApp: a mensagem é definida no JS (para evitar `?text=` desatualizado no HTML)
document.querySelectorAll('.btn-whatsapp, .whatsapp-float').forEach(btn => {
    const href = btn.getAttribute('href') || '';
    const base = href.includes('wa.me') ? (href.split('?')[0] || `https://wa.me/${whatsappNumber}`) : `https://wa.me/${whatsappNumber}`;

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const message = getWhatsappMessageForContext(btn);
        const url = `${base}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    });
});

// Add CSS for active nav link
const style = document.createElement('style');
style.textContent = `
    .nav a.active {
        color: var(--primary-color);
        border-bottom: 2px solid var(--primary-color);
    }
    
    body.loaded {
        animation: fadeIn 0.5s ease-in;
    }
    
    .mobile-menu-btn {
        background: none;
        border: none;
        color: var(--white);
        font-size: 1.4rem;
        cursor: pointer;
        padding: 12px;
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    @media (max-width: 768px) {
        .nav {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(20px);
            padding: 16px 20px 24px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }
        
        .nav.active {
            display: block;
        }
        
        .nav ul {
            flex-direction: column;
            gap: 4px;
        }
    }
`;
document.head.appendChild(style);

// Service Tabs Functionality - Feel King Style (Only for dropdown menu)
const tabContents = document.querySelectorAll('.service-tab-content');

function switchToTab(targetTab) {
    // Remove active class from all contents
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to target content
    const targetContent = document.querySelector(`[data-content="${targetTab}"]`);
    if (targetContent) {
        targetContent.classList.add('active');
        
        // Check header position after tab switch
        setTimeout(() => {
            checkHeaderPosition();
        }, 50);
    }
}

// Dropdown Menu Navigation
const dropdownLinks = document.querySelectorAll('.dropdown-menu a');
const dropdownToggle = document.querySelector('.dropdown-toggle');
const dropdownParent = document.querySelector('.dropdown');

// Toggle dropdown on mobile
if (dropdownToggle) {
    dropdownToggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            dropdownParent.classList.toggle('active');
        }
    });
}

dropdownLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = link.getAttribute('data-tab');
        
        if (dropdownParent) dropdownParent.classList.remove('active');
        document.querySelector('.nav')?.classList.remove('active');
        
        // Switch to the selected tab first
        switchToTab(targetTab);
        
        // Wait a bit for the tab to render, then scroll to services section
        setTimeout(() => {
            const servicesSection = document.querySelector('#servicos');
            if (servicesSection) {
                // Get the absolute position of the services section
                const rect = servicesSection.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const targetPosition = rect.top + scrollTop;
                
                // Scroll to the exact top of the services section (no offset)
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Check header position multiple times during and after scroll
                let checkCount = 0;
                const checkInterval = setInterval(() => {
                    checkHeaderPosition();
                    checkCount++;
                    if (checkCount >= 15) {
                        clearInterval(checkInterval);
                    }
                }, 100);
            }
        }, 50);
    });
});

// Scroll Down Indicator - Smooth scroll to services section
document.querySelectorAll('.scroll-down-indicator').forEach(indicator => {
    indicator.addEventListener('click', () => {
        const serviceDetails = document.querySelector('.service-details-section');
        if (serviceDetails) {
            const targetPosition = serviceDetails.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// About section slider
(() => {
    const slides = document.querySelectorAll('.about-slide');
    const dots = document.querySelectorAll('.about-dot');
    if (!slides.length) return;

    let current = 0;
    let timer = setInterval(nextSlide, 4000);

    function goTo(index) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = index;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
    }

    function nextSlide() {
        goTo((current + 1) % slides.length);
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            clearInterval(timer);
            goTo(Number(dot.dataset.slide));
            timer = setInterval(nextSlide, 4000);
        });
    });
})();

// Gallery Slider - auto-play e dots (layout igual Sobre)
(() => {
    const slides = document.querySelectorAll('.gallery-slide');
    const dotsContainer = document.querySelector('.gallery-slider-dots');
    if (!slides.length || !dotsContainer) return;

    for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement('span');
        dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
        dot.dataset.slide = String(i);
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dotsContainer.appendChild(dot);
    }

    const dots = document.querySelectorAll('.gallery-slider-dots .gallery-dot');
    let current = 0;
    let timer = setInterval(nextSlide, 4000);

    function goTo(index) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = index;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
    }

    function nextSlide() {
        goTo((current + 1) % slides.length);
    }

    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            clearInterval(timer);
            goTo(Number(dot.dataset.slide));
            timer = setInterval(nextSlide, 4000);
        });
    });
})();

// Gallery Lightbox - clique na foto para ampliar
(() => {
    const lightbox = document.getElementById('gallery-lightbox');
    const overlay = lightbox?.querySelector('.gallery-lightbox-overlay');
    const img = lightbox?.querySelector('.gallery-lightbox-img');
    const titleEl = lightbox?.querySelector('.gallery-lightbox-title');
    const closeBtn = lightbox?.querySelector('.gallery-lightbox-close');

    function openLightbox(src, alt, title) {
        if (!img || !titleEl) return;
        img.src = src;
        img.alt = alt;
        titleEl.textContent = title;
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox?.classList.remove('active');
        lightbox?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.gallery-slide').forEach(slide => {
        slide.addEventListener('click', () => {
            const imgEl = slide.querySelector('.gallery-slide-image img');
            const titleElCard = slide.querySelector('.gallery-slide-content h3');
            if (imgEl) openLightbox(imgEl.src, imgEl.alt, titleElCard?.textContent || '');
        });
    });

    overlay?.addEventListener('click', closeLightbox);
    closeBtn?.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
})();

// Carrossel de depoimentos - animação via JS para rodar sempre (navegadores pausam CSS animation off-screen)
function startTestimonialsCarousel() {
    const track = document.getElementById('testimonials-track');
    const wrapper = track?.closest('.testimonials-carousel-wrapper');
    if (!track || !wrapper || wrapper.classList.contains('testimonials-error-state')) return;
    if (track._carouselStarted) return;
    track._carouselStarted = true;

    let offset = 0;
    const speed = 0.8; // px por frame (~48px/s em 60fps)
    let lastTime = performance.now();
    let isPaused = false;

    wrapper.addEventListener('mouseenter', () => { isPaused = true; wrapper.classList.add('is-paused'); });
    wrapper.addEventListener('mouseleave', () => { isPaused = false; wrapper.classList.remove('is-paused'); });
    wrapper.addEventListener('touchstart', () => { isPaused = true; wrapper.classList.add('is-paused'); }, { passive: true });
    wrapper.addEventListener('touchend', () => { isPaused = false; wrapper.classList.remove('is-paused'); }, { passive: true });

    function animate(now) {
        if (!isPaused) {
            const dt = Math.min((now - lastTime) / 16.67, 3); // limitar dt para evitar saltos
            lastTime = now;
            const halfWidth = track.scrollWidth / 2;
            if (halfWidth > 0) {
                offset += speed * dt;
                if (offset >= halfWidth) offset -= halfWidth;
                track.style.transform = `translateX(-${offset}px)`;
            }
        }
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

// Google Reviews - Carrega depoimentos reais do Google Places API
(async function loadGoogleReviews() {
    const grid = document.getElementById('testimonials-track');
    const loading = document.getElementById('testimonials-loading');
    const ratingCount = document.getElementById('rating-count');
    const ratingStars = document.getElementById('rating-stars');

    if (!grid) return;

    try {
        const baseUrl = window.location.origin;
        const res = await fetch(`${baseUrl}/api/reviews`);
        const data = await res.json();

        if (loading) loading.remove();

        if (!res.ok) {
            const errMsg = (data.error || data.message || res.statusText) || 'Erro desconhecido';
            grid.parentElement?.classList.add('testimonials-error-state');
            grid.innerHTML = `<p class="testimonials-error">Depoimentos em manutenção. Volte em breve!</p><p class="testimonials-debug" style="font-size:11px;color:#888;margin-top:8px;">${errMsg}</p>`;
            if (ratingCount) ratingCount.textContent = 'Com base em 1369 avaliações';
            const btnVer = document.getElementById('btn-ver-avaliacoes');
            if (btnVer) btnVer.innerHTML = 'Ver avaliações no Google <i class="fas fa-external-link-alt"></i>';
            return;
        }

        const totalReviews = data.totalReviews || 1369;
        if (ratingCount) ratingCount.textContent = `Com base em ${totalReviews} avaliações`;
        
        const btnVerAvaliacoes = document.getElementById('btn-ver-avaliacoes');
        if (btnVerAvaliacoes) {
            btnVerAvaliacoes.innerHTML = `Ver todas as ${totalReviews} avaliações no Google <i class="fas fa-external-link-alt"></i>`;
        }

        const reviews = data.reviews || [];
        if (reviews.length === 0) {
            grid.parentElement?.classList.add('testimonials-error-state');
            grid.innerHTML = '<p class="testimonials-error">Nenhum depoimento disponível no momento.</p>';
            return;
        }

        const cardHtml = reviews.map((review) => {
            const stars = '★'.repeat(Math.min(5, Math.round(review.rating || 5)));
            const text = (review.text || '').substring(0, 280);
            const moreText = (review.text || '').length > 280 ? '...' : '';
            const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const escapedAuthor = (review.author || 'Cliente').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const photoUrl = review.photo ? `src="${review.photo.replace(/"/g, '&quot;')}"` : '';
            const avatarHtml = review.photo
                ? `<img class="testimonial-card-avatar" ${photoUrl} alt="${escapedAuthor}" loading="lazy">`
                : `<div class="testimonial-card-avatar testimonial-card-avatar-placeholder"><i class="fas fa-user"></i></div>`;
            const timeHtml = review.time ? `<div class="author-time">${review.time.replace(/&/g, '&amp;')}</div>` : '';
            return `
                <div class="testimonial-card testimonial-carousel-card">
                    <div class="testimonial-card-premium-header">
                        ${avatarHtml}
                        <div class="testimonial-card-premium-meta">
                            <div class="stars">${stars}</div>
                            <div class="author">${escapedAuthor}</div>
                            ${timeHtml}
                        </div>
                    </div>
                    <p>"${escapedText}${moreText}"</p>
                </div>
            `;
        }).join('');
        grid.innerHTML = cardHtml + cardHtml;

        const cards = grid.querySelectorAll('.testimonial-card');
        cards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        });
        setTimeout(() => {
            cards.forEach((card, i) => {
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, i * 80);
            });
        }, 100);
        startTestimonialsCarousel();

    } catch (err) {
        if (loading) loading.remove();
        const fallbackHtml = [
            { author: 'Victor Amaral', text: 'Cortei cabelo com o Alisson e ficou bom demais!' },
            { author: 'Marcelo Muller', text: 'Maravilhosa. Barbeiro Daniel é TOP!' },
            { author: 'Dr. Daniel Gomes', text: 'Atendimento e trabalho muito top viu!' },
            { author: 'Lucas Matheus', text: 'Excelente atendimento e serviço!' },
            { author: 'Yuri Tavares', text: 'Moisés excelente profissional, recomendo.' },
            { author: 'Fabio Augusto Rosa', text: 'Ótimo profissional, atendimento top lugar agradável' },
        ].map((r) => `
            <div class="testimonial-card testimonial-carousel-card">
                <div class="testimonial-card-premium-header">
                    <div class="testimonial-card-avatar testimonial-card-avatar-placeholder"><i class="fas fa-user"></i></div>
                    <div class="testimonial-card-premium-meta">
                        <div class="stars">★★★★★</div>
                        <div class="author">${r.author}</div>
                    </div>
                </div>
                <p>"${r.text}"</p>
            </div>
        `).join('');
        grid.innerHTML = fallbackHtml + fallbackHtml;
        if (ratingCount) ratingCount.textContent = 'Com base em 1369 avaliações';
        const btnVerAvaliacoes = document.getElementById('btn-ver-avaliacoes');
        if (btnVerAvaliacoes) btnVerAvaliacoes.innerHTML = 'Ver todas as 1369 avaliações no Google <i class="fas fa-external-link-alt"></i>';
        startTestimonialsCarousel();
    }
})();

