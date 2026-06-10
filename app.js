/* Skynet Global Logistics - Client Functionality */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 0. Interactive Hero Particle Canvas System
  // ==========================================
  const canvas = document.getElementById('hero-particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const heroSection = document.querySelector('.hero');

    let width = (canvas.width = heroSection.offsetWidth);
    let height = (canvas.height = heroSection.offsetHeight);

    let particles = [];
    const maxParticles = window.innerWidth < 768 ? 55 : 144; // Fibonacci numbers
    const connectionDist = 144; // Fibonacci number

    let mouse = { x: null, y: null, active: false, pulseRadius: 0 };
    let shockwaves = []; // To store active click shockwaves

    class Particle {
      constructor() {
        this.reset(true); // Random initial spawn positions
      }

      reset(init = false) {
        if (init) {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
        } else {
          // Spawn at boundaries on normal out-of-bounds reset
          this.x = Math.random() > 0.5 ? -15 : width + 15;
          this.y = Math.random() * height;
          if (Math.random() > 0.5) {
            this.x = Math.random() * width;
            this.y = Math.random() > 0.5 ? -15 : height + 15;
          }
        }

        // 3D Depth parameter (proportioned by Golden Ratio splits: 0.382 / 0.618)
        this.z = 0.382 + Math.random() * 0.618;

        // Base drift velocities (proportioned by Golden Ratio)
        const speedFactor = this.z * 0.618;
        this.baseVx = (Math.random() - 0.5) * speedFactor;
        this.baseVy = (Math.random() - 0.5) * speedFactor;

        this.vx = this.baseVx;
        this.vy = this.baseVy;

        // Radius scale using Golden Ratio bounds (1.618px min, 4.236px max before depth scaling)
        this.radius = (1.618 + Math.random() * 2.618) * this.z;
        this.alpha = this.z * 1.0;

        // Color wheel harmonics: Base blue (220), Analogous Cyan (190), Triadic Magenta (320), Complementary Gold (40)
        const rand = Math.random();
        if (rand > 0.5) {
          this.baseHue = 220; // Blue
        } else if (rand > 0.25) {
          this.baseHue = 190; // Cyan
        } else if (rand > 0.1) {
          this.baseHue = 320; // Magenta
        } else {
          this.baseHue = 40;  // Gold/Orange
        }

        // No star shapes — all particles are simple circles
        this.isStar = false;
        this.isFiveStar = false;
        this.isExploding = false;

        this.color = `hsl(${this.baseHue}, 90%, 65%)`;
      }

      update() {
        // Apply click shockwaves first
        shockwaves.forEach(wave => {
          const dx = this.x - wave.x;
          const dy = this.y - wave.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0) {
            // Apply push force if particle is close to the shockwave radius
            const waveWidth = 40;
            if (dist < wave.radius && dist > wave.radius - waveWidth) {
              const strength = (waveWidth - (wave.radius - dist)) / waveWidth;
              const pushForce = strength * 6 * this.z * (1 - wave.radius / 500); // fades as it expands
              this.vx += (dx / dist) * pushForce;
              this.vy += (dy / dist) * pushForce;
            }
          }
        });

        // Magnetism + orbital swirl around mouse
        if (mouse.active && mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);
          const activeRadius = 178; // Golden Ratio: 11.09 * 16px ≈ 178px
          if (dist < activeRadius) {
            const force = (activeRadius - dist) / activeRadius;

            // Attraction acceleration (smooth gravitational pull, scaled by Golden Ratio component)
            const pull = force * 0.1618 * this.z;
            this.vx += (dx / dist) * pull;
            this.vy += (dy / dist) * pull;

            // Orbital swirl perpendicular velocity (high-tech vortex, scaled by Golden Ratio component)
            const swirl = force * 0.0618 * this.z;
            this.vx += (-dy / dist) * swirl;
            this.vy += (dx / dist) * swirl;
          }
        }

        // Apply physical friction damping (elastic inertia)
        this.vx *= 0.94;
        this.vy *= 0.94;

        // Return forces back to baseline drift (natural flow recovery)
        this.vx += this.baseVx * 0.06;
        this.vy += this.baseVy * 0.06;

        // Hypnotic sine wave oscillation (slow, undulating breathing movement)
        const time = Date.now() * 0.001;
        const waveX = Math.sin(time * 0.8 + this.baseHue) * 0.8 * this.z;
        const waveY = Math.cos(time * 0.7 + this.baseHue) * 0.8 * this.z;

        // Apply velocities and waves to coordinates
        this.x += this.vx + waveX;
        this.y += this.vy + waveY;

        // Hypnotic breathing radius (pulsating slowly)
        this.currentRadius = this.radius + Math.sin(time * 1.5 + this.baseHue) * (this.radius * 0.4);

        // Dynamic color wheel shifting (harmonics reflecting position and time)
        const timeShift = Date.now() * 0.015;
        const spaceShift = (this.x / width) * 45; // hue reflects horizontal position
        const hue = (this.baseHue + timeShift + spaceShift) % 360;
        this.color = `hsl(${hue}, 90%, 65%)`;

        // Star explosion logic (4-pointed sparkle)
        if (this.isStar && !this.isExploding) {
          this.rotation += this.rotationSpeed; // Spin the star smoothly
          this.explodeTimer--;
          if (this.explodeTimer <= 0) {
            this.isExploding = true;
            // Supernova explosion: big glowing shockwave
            shockwaves.push({ x: this.x, y: this.y, radius: 10, color: '255, 215, 0', isSupernova: true });
          }
        }

        // 5-pointed star: slow dreamy rotation
        if (this.isFiveStar) {
          this.rotation += this.rotationSpeed;
        }

        if (this.isExploding) {
          this.currentRadius += 2.5; // Expand rapidly
          this.alpha -= 0.04;        // Fade out
          // Strobing light effect while exploding
          this.color = Math.random() > 0.5 ? '#ffffff' : `hsl(50, 100%, 75%)`;
          if (this.alpha <= 0) {
            this.reset(false);
          }
        }

        // Reset if drifted too far out of bounds
        if (!this.isExploding && (this.x < -30 || this.x > width + 30 || this.y < -30 || this.y > height + 30)) {
          this.reset(false);
        }
      }

      draw() {
        ctx.beginPath();
        // Use currentRadius for hypnotic breathing if defined, otherwise fallback to radius
        const r = Math.max(0.1, this.currentRadius || this.radius);

        if (this.isStar) {
          // Draw a sharp 4-pointed diamond star (sparkle)
          const spikes = 4;
          const outerRadius = r * 3.0; // Long, sharp points
          const innerRadius = r * 0.3; // Very tight core
          let rot = (Math.PI / 2 * 3) + (this.rotation || 0);
          const step = Math.PI / spikes;

          ctx.moveTo(this.x + Math.cos(rot) * outerRadius, this.y + Math.sin(rot) * outerRadius);
          for (let i = 0; i < spikes; i++) {
            rot += step;
            ctx.lineTo(this.x + Math.cos(rot) * innerRadius, this.y + Math.sin(rot) * innerRadius);
            rot += step;
            ctx.lineTo(this.x + Math.cos(rot) * outerRadius, this.y + Math.sin(rot) * outerRadius);
          }
          ctx.closePath();
        } else if (this.isFiveStar) {
          // Draw a classic 5-pointed star
          const spikes = 5;
          const outerRadius = r * 2.618; // φ² scaling — outer tips
          const innerRadius = r * 1.0;   // Inner concave ring
          let rot = -(Math.PI / 2) + (this.rotation || 0); // Top-pointing start
          const step = Math.PI / spikes;

          ctx.moveTo(this.x + Math.cos(rot) * outerRadius, this.y + Math.sin(rot) * outerRadius);
          for (let i = 0; i < spikes; i++) {
            rot += step;
            ctx.lineTo(this.x + Math.cos(rot) * innerRadius, this.y + Math.sin(rot) * innerRadius);
            rot += step;
            ctx.lineTo(this.x + Math.cos(rot) * outerRadius, this.y + Math.sin(rot) * outerRadius);
          }
          ctx.closePath();
        } else {
          ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        }

        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;

        // Enhanced glow for star shapes; subtle for circles
        ctx.shadowBlur = (this.isStar || this.isFiveStar) ? 20 * this.z : 5 * this.z;
        ctx.shadowColor = this.color;
        ctx.fill();

        ctx.shadowBlur = 0; // reset
        ctx.globalAlpha = 1.0; // reset
      }
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Update and Draw Click Shockwaves
      shockwaves.forEach((wave, idx) => {
        wave.radius += 5.5; // expansion speed
        if (wave.radius > 500) {
          shockwaves.splice(idx, 1);
        } else {
          // Draw subtle shockwave ring on canvas
          ctx.beginPath();
          ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
          const alpha = 0.15 * (1 - wave.radius / 500);
          const rgb = wave.color || '28, 100, 242';
          ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
          ctx.lineWidth = wave.isSupernova ? 4 : 2;
          ctx.stroke();

          if (wave.isSupernova && wave.radius > 20) {
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 1.5})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      });

      // 2. Update and Draw Particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // 3. Draw colorful gradient connection lines between adjacent nodes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < connectionDist) {
            const alpha = (connectionDist - dist) / connectionDist * 0.14 * p1.alpha * p2.alpha;

            // Create a linear gradient connecting the two nodes
            const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            grad.addColorStop(0, p1.color);
            grad.addColorStop(1, p2.color);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = grad;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 0.8 * Math.min(p1.z, p2.z);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }
      }

      // 4. Draw mouse interaction effects (radar scans, telemetry packets, line connections)
      if (mouse.active && mouse.x !== null) {
        // Draw Sonar Radar Sweep
        mouse.pulseRadius += 0.8;
        if (mouse.pulseRadius > 144) { // Fibonacci number: 144
          mouse.pulseRadius = 0;
        }

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.pulseRadius, 0, Math.PI * 2);
        const radarAlpha = 0.08 * (1 - mouse.pulseRadius / 144);
        ctx.strokeStyle = `rgba(16, 185, 129, ${radarAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        particles.forEach(p => {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          const activeRadius = 178; // Golden Ratio: 11.09 * 16px ≈ 178px
          if (dist < activeRadius) {
            const alpha = (activeRadius - dist) / activeRadius * 0.18 * p.alpha;

            // Draw connection line
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`; // glowing green connector
            ctx.lineWidth = 0.9 * p.z;
            ctx.stroke();

            // Draw traveling data packet along connection line
            const timeOffset = (Date.now() / 1200 + p.z * 10) % 1.0;
            const px = mouse.x + (p.x - mouse.x) * timeOffset;
            const py = mouse.y + (p.y - mouse.y) * timeOffset;

            ctx.beginPath();
            ctx.arc(px, py, 1.6 * p.z, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * 1.5;
            ctx.shadowBlur = 4;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
          }
        });

        // Draw cursor indicator
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#10b981';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      requestAnimationFrame(animateParticles);
    };

    // Resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width = canvas.width = heroSection.offsetWidth;
        height = canvas.height = heroSection.offsetHeight;
        initParticles();
      }, 250);
    });

    // Mouse movement listeners
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });

    heroSection.addEventListener('mouseleave', () => {
      mouse.active = false;
      mouse.pulseRadius = 0;
    });

    // Shockwave click listener
    heroSection.addEventListener('click', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      shockwaves.push({ x: clickX, y: clickY, radius: 0 });
    });

    initParticles();
    animateParticles();
  }

  // ==========================================
  // 1. Header Sticky & Scroll Effect
  // ==========================================
  const header = document.getElementById('header');

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check


  // ==========================================
  // 2. Mobile Drawer Navigation
  // ==========================================
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileClose = document.getElementById('mobileClose');
  const mobileNav = document.getElementById('mobileNav');
  const mobileOverlay = document.getElementById('mobileOverlay');

  const openMobileNav = () => {
    mobileNav.classList.add('open');
    mobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeMobileNav = () => {
    mobileNav.classList.remove('open');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  mobileToggle.addEventListener('click', openMobileNav);
  mobileClose.addEventListener('click', closeMobileNav);
  mobileOverlay.addEventListener('click', closeMobileNav);

  const mobileLinks = ['mobileLinkAbout', 'mobileLinkServices', 'mobileLinkContact', 'mobileLinkQuote'];
  mobileLinks.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', closeMobileNav);
  });


  // ==========================================
  // 3. Scroll Reveal Animations (Intersection Observer)
  // ==========================================
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  // ==========================================
  // 4. Shipment Tracker Modal — Now with API
  // ==========================================
  const trackBtn = document.getElementById('trackShipmentBtn');
  const mobileTrackLink = document.getElementById('mobileLinkTrack');
  const footerTrackLink = document.getElementById('footerTrackLink');

  const trackerOverlay = document.getElementById('trackerModalOverlay');
  const trackerModal = document.getElementById('trackerModal');
  const trackerClose = document.getElementById('trackerModalClose');

  const trackingInput = document.getElementById('trackingInput');
  const btnSearchTracking = document.getElementById('btnSearchTracking');
  const trackingResult = document.getElementById('trackingResult');
  const trackingError = document.getElementById('trackingError');
  const trackingTimeline = document.getElementById('trackingTimeline');
  const trackStatus = document.getElementById('trackStatus');
  const trackCodeHeader = document.getElementById('trackCodeHeader');

  const openTracker = (e) => {
    if (e) e.preventDefault();
    closeMobileNav();
    trackerOverlay.classList.add('open');
    trackerModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    trackingInput.focus();
  };

  const closeTracker = () => {
    trackerOverlay.classList.remove('open');
    trackerModal.classList.remove('open');
    document.body.style.overflow = '';
    trackingInput.value = '';
    trackingResult.style.display = 'none';
    trackingError.style.display = 'none';
  };

  trackBtn.addEventListener('click', openTracker);
  if (mobileTrackLink) mobileTrackLink.addEventListener('click', openTracker);
  if (footerTrackLink) footerTrackLink.addEventListener('click', openTracker);

  trackerClose.addEventListener('click', closeTracker);
  trackerOverlay.addEventListener('click', closeTracker);

  // Quick Suggestion Badges click handler
  const suggestionBadges = document.querySelectorAll('.suggestion-badge');
  suggestionBadges.forEach(badge => {
    badge.addEventListener('click', () => {
      const code = badge.dataset.code;
      trackingInput.value = code;
      handleTrackingSearch();
    });
  });

  // *** API-powered tracking search ***
  const handleTrackingSearch = async () => {
    const code = trackingInput.value.trim().toUpperCase();
    if (!code) return;

    // Show loading state
    btnSearchTracking.disabled = true;
    btnSearchTracking.textContent = '...';

    try {
      const response = await fetch(`/api/shipments/track/${encodeURIComponent(code)}`);
      const result = await response.json();

      if (result.success && result.data) {
        const shipment = result.data;
        trackStatus.textContent = shipment.status;
        trackCodeHeader.textContent = shipment.trackingCode;

        trackStatus.style.color = shipment.status === 'Delivered' ? '#10b981' : 'var(--primary)';

        trackingTimeline.innerHTML = '';
        shipment.events.forEach(ev => {
          const item = document.createElement('div');
          item.className = `timeline-item ${ev.active ? 'active' : ''}`;
          item.innerHTML = `
            <div class="timeline-badge flex-center">
              ${ev.title === 'Delivered' ? '&check;' : '&bull;'}
            </div>
            <div class="timeline-content">
              <div class="timeline-title">${ev.title}</div>
              <div class="timeline-desc">${ev.desc}</div>
            </div>
            <div class="timeline-time">${ev.time}</div>
          `;
          trackingTimeline.appendChild(item);
        });

        trackingResult.style.display = 'block';
        trackingError.style.display = 'none';
      } else {
        trackingResult.style.display = 'none';
        trackingError.style.display = 'block';
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      trackingResult.style.display = 'none';
      trackingError.style.display = 'block';
    } finally {
      btnSearchTracking.disabled = false;
      btnSearchTracking.textContent = 'Track';
    }
  };

  btnSearchTracking.addEventListener('click', handleTrackingSearch);
  trackingInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleTrackingSearch();
  });


  // ==========================================
  // 5. Contact Tabs (Form vs Estimator)
  // ==========================================
  const tabContact = document.getElementById('tabContact');
  const tabEstimate = document.getElementById('tabEstimate');
  const contactForm = document.getElementById('contactForm');
  const quoteEstimator = document.getElementById('quoteEstimator');

  tabContact.addEventListener('click', () => {
    tabContact.classList.add('active');
    tabEstimate.classList.remove('active');
    contactForm.style.display = 'block';
    quoteEstimator.style.display = 'none';
  });

  tabEstimate.addEventListener('click', () => {
    tabEstimate.classList.add('active');
    tabContact.classList.remove('active');
    quoteEstimator.style.display = 'block';
    contactForm.style.display = 'none';
    resetEstimator();
  });


  // ==========================================
  // 6. Quote Estimator Stepper & Validation Logic
  // ==========================================
  let currentStep = 1;
  const totalSteps = 3;
  const btnPrev = document.getElementById('btnPrevStep');
  const btnNext = document.getElementById('btnNextStep');

  const steps = document.querySelectorAll('.calculator-step');
  const stepNodes = document.querySelectorAll('.step-node');
  const progressLine = document.getElementById('stepProgressLine');
  const calcLoader = document.getElementById('calcLoader');

  // Input fields and validation elements
  const originInput = document.getElementById('originCountry');
  const destInput = document.getElementById('destCountry');
  const originError = document.getElementById('originError');
  const destError = document.getElementById('destError');

  const cargoType = document.getElementById('cargoType');
  const cargoWeight = document.getElementById('cargoWeight');
  const cargoVolume = document.getElementById('cargoVolume');
  const weightError = document.getElementById('weightError');
  const volumeError = document.getElementById('volumeError');

  const quoteAmount = document.getElementById('quoteAmount');
  const calcContactEmail = document.getElementById('calcContactEmail');
  const emailError = document.getElementById('emailError');

  // Input listener resets for validation
  originInput.addEventListener('input', () => {
    originInput.classList.remove('error');
    originError.style.display = 'none';
  });
  destInput.addEventListener('input', () => {
    destInput.classList.remove('error');
    destError.style.display = 'none';
  });
  cargoWeight.addEventListener('input', () => {
    cargoWeight.classList.remove('error');
    weightError.style.display = 'none';
  });
  cargoVolume.addEventListener('input', () => {
    cargoVolume.classList.remove('error');
    volumeError.style.display = 'none';
  });
  calcContactEmail.addEventListener('input', () => {
    calcContactEmail.classList.remove('error');
    emailError.style.display = 'none';
  });

  const updateStepUI = () => {
    // Show/hide correct forms
    steps.forEach(step => {
      step.classList.remove('active');
      if (parseInt(step.dataset.step) === currentStep) {
        step.classList.add('active');
      }
    });

    // Update stepper nodes
    stepNodes.forEach(node => {
      const stepVal = parseInt(node.dataset.step);
      node.className = 'step-node'; // Reset

      if (stepVal < currentStep) {
        node.classList.add('completed');
      } else if (stepVal === currentStep) {
        node.classList.add('active');
      }
    });

    // Update horizontal connecting line width
    if (currentStep === 1) {
      progressLine.style.width = '0%';
      btnPrev.style.display = 'none';
      btnNext.textContent = 'Next';
    } else if (currentStep === 2) {
      progressLine.style.width = '50%';
      btnPrev.style.display = 'block';
      btnNext.textContent = 'Get Quote';
    } else if (currentStep === totalSteps) {
      progressLine.style.width = '100%';
      btnPrev.style.display = 'block';
      btnNext.textContent = 'Get Quote Summary';
    }
  };

  const calculateEstimate = () => {
    const origin = originInput.value.trim();
    const dest = destInput.value.trim();
    const type = cargoType.value;
    const weight = parseFloat(cargoWeight.value) || 0;
    const volume = parseFloat(cargoVolume.value) || 0;

    const distanceFactor = Math.max(origin.length + dest.length, 10) * 12;

    let baseRate = 0;
    let weightRate = 0;
    let volumeRate = 0;

    switch (type) {
      case 'air':
        baseRate = 200;
        weightRate = 6.5;
        volumeRate = 95;
        break;
      case 'ocean-fcl':
        baseRate = 2200;
        weightRate = 0;
        volumeRate = 0;
        break;
      case 'ocean-lcl':
        baseRate = 450;
        weightRate = 2.2;
        volumeRate = 60;
        break;
      case 'land':
        baseRate = 120;
        weightRate = 1.4;
        volumeRate = 25;
        break;
    }

    const price = baseRate + (weight * weightRate) + (volume * volumeRate) + distanceFactor;
    return price.toFixed(2);
  };

  const resetEstimator = () => {
    currentStep = 1;
    originInput.value = '';
    destInput.value = '';
    originInput.classList.remove('error');
    destInput.classList.remove('error');
    originError.style.display = 'none';
    destError.style.display = 'none';

    cargoType.selectedIndex = 0;
    cargoWeight.value = 100;
    cargoVolume.value = 1;
    cargoWeight.classList.remove('error');
    cargoVolume.classList.remove('error');
    weightError.style.display = 'none';
    volumeError.style.display = 'none';

    calcContactEmail.value = '';
    calcContactEmail.classList.remove('error');
    emailError.style.display = 'none';

    updateStepUI();
  };

  // *** Save quote to database ***
  const saveQuoteToAPI = async (estimatedCost, email) => {
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: originInput.value.trim(),
          destination: destInput.value.trim(),
          freightType: cargoType.value,
          weight: parseFloat(cargoWeight.value),
          volume: parseFloat(cargoVolume.value),
          estimatedCost: parseFloat(estimatedCost),
          contactEmail: email || ''
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.warn('Quote save warning:', result.message);
      }
    } catch (err) {
      console.error('Quote save error:', err);
      // Don't block the UX if save fails — quote was already shown
    }
  };

  btnNext.addEventListener('click', () => {
    if (currentStep === 1) {
      let valid = true;
      if (!originInput.value.trim()) {
        originInput.classList.add('error');
        originError.style.display = 'block';
        valid = false;
      }
      if (!destInput.value.trim()) {
        destInput.classList.add('error');
        destError.style.display = 'block';
        valid = false;
      }
      if (!valid) {
        showToast('Please correct route errors before advancing.', 'error');
        return;
      }
      currentStep++;
      updateStepUI();

    } else if (currentStep === 2) {
      let valid = true;
      if (parseFloat(cargoWeight.value) <= 0 || !cargoWeight.value) {
        cargoWeight.classList.add('error');
        weightError.style.display = 'block';
        valid = false;
      }
      if (parseFloat(cargoVolume.value) <= 0 || !cargoVolume.value) {
        cargoVolume.classList.add('error');
        volumeError.style.display = 'block';
        valid = false;
      }
      if (!valid) {
        showToast('Please correct cargo specifications before advancing.', 'error');
        return;
      }

      // UX Improvement: Show animated rate calculation delay
      // Hide Step 2 form and navigation buttons
      steps[1].classList.remove('active');
      btnPrev.style.display = 'none';
      btnNext.style.display = 'none';
      calcLoader.style.display = 'flex'; // Show spinner

      setTimeout(() => {
        calcLoader.style.display = 'none'; // Hide spinner

        // Show step 3 results
        const calculatedPrice = calculateEstimate();
        quoteAmount.textContent = `$${calculatedPrice}`;

        currentStep++;
        updateStepUI();
        btnNext.style.display = 'block';

        // Save quote to database in background (no email yet)
        saveQuoteToAPI(calculatedPrice, '');
      }, 1200);

    } else if (currentStep === totalSteps) {
      const email = calcContactEmail.value.trim();
      if (email && !validateEmail(email)) {
        calcContactEmail.classList.add('error');
        emailError.style.display = 'block';
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      // Save final quote with email to database
      const finalCost = quoteAmount.textContent.replace('$', '');
      saveQuoteToAPI(finalCost, email);

      showToast('Thank you! A detailed quote summary has been generated.', 'success');
      resetEstimator();
      tabContact.click(); // Switch back to Direct Message tab
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateStepUI();
    }
  });


  // ==========================================
  // 7. Direct Message Form — Now with API
  // ==========================================
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameField = document.getElementById('fullName');
    const emailField = document.getElementById('emailAddress');
    const companyField = document.getElementById('companyName');
    const phoneField = document.getElementById('phoneNumber');
    const messageField = document.getElementById('message');

    const name = nameField.value.trim();
    const email = emailField.value.trim();

    if (!validateEmail(email)) {
      emailField.classList.add('error');
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    emailField.classList.remove('error');

    // Disable submit button during request
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          company: companyField.value.trim(),
          email: email,
          phone: phoneField.value.trim(),
          message: messageField.value.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Thank you, ${name}! Your inquiry has been sent. Our team will contact you shortly.`, 'success');
        contactForm.reset();
      } else {
        const errMsg = result.errors
          ? result.errors.map(e => e.message).join('. ')
          : result.message || 'Failed to send message.';
        showToast(errMsg, 'error');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });


  // ==========================================
  // 8. Toast Alert & Validation Helpers
  // ==========================================
  const toastContainer = document.getElementById('toastContainer');

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ?
      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` :
      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>`;

    toast.innerHTML = `
      ${icon}
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 4000);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // ==========================================
  // 9. Interactive Global Network Map
  // ==========================================
  const regionData = {
    australia: {
      title: "Oceania Hub (Sydney)",
      desc: "Our primary southern gateway. Anchored by the automated Sydney airport logistics park and Oxford Street office, this hub coordinates express delivery, ocean container freight, and domestic land transportation across Australia and NZ.",
      hubs: "12 Hubs",
      speed: "2-3 Days",
      nodeId: "nodeAustralia",
      routeId: "routeAustralia"
    },
    asia: {
      title: "Asia Pacific Hub (Singapore)",
      desc: "Located at the heart of global trade. Connects manufacturing centers in China, India, and Southeast Asia to our worldwide network, managing high-volume FCL ocean liners and air routes.",
      hubs: "24 Hubs",
      speed: "1-2 Days",
      nodeId: "nodeAsia",
      routeId: "routeAsia"
    },
    dubai: {
      title: "Middle East Hub (Dubai)",
      desc: "Our strategic crossroads of global commerce. Centered at Jebel Ali Port and Al Maktoum International Airport, this facility manages high-speed sea-to-air cargo transfers and regional customs routing.",
      hubs: "10 Hubs",
      speed: "1-2 Days",
      nodeId: "nodeDubai",
      routeId: "routeDubai"
    },
    europe: {
      title: "European Gateway (Frankfurt)",
      desc: "Our central hub for continental Europe. Integrates air cargo gates at Frankfurt Airport with express road freight connections, customs clearing, and cold-chain pharma distribution.",
      hubs: "18 Hubs",
      speed: "2-4 Days",
      nodeId: "nodeEurope",
      routeId: "routeEurope"
    },
    americas: {
      title: "North America Hub (Los Angeles)",
      desc: "Accessing the Pacific trade corridor. Anchored by our West Coast seaport connections and airport logistics center, managing transpacific freight forwarding and transcontinental freight rail.",
      hubs: "15 Hubs",
      speed: "3-4 Days",
      nodeId: "nodeAmericas",
      routeId: "routeAmericas"
    }
  };

  const mapButtons = document.querySelectorAll('.region-btn');
  const landmass = document.querySelector('.land-mass');
  const routeLines = document.querySelectorAll('.route-line');
  const hubNodes = document.querySelectorAll('.hub-node');

  // Build references to all labels and pulse rings
  const allRegions = ['americas', 'asia', 'dubai', 'europe', 'australia'];

  const highlightRegion = (regionKey) => {
    const data = regionData[regionKey];
    if (!data) return;

    // Update text fields with fade transition
    const regionTitle = document.getElementById('regionTitle');
    const regionDesc = document.getElementById('regionDesc');
    regionTitle.style.opacity = '0';
    regionDesc.style.opacity = '0';
    setTimeout(() => {
      regionTitle.textContent = data.title;
      regionDesc.textContent = data.desc;
      regionTitle.style.opacity = '1';
      regionDesc.style.opacity = '1';
    }, 180);
    document.getElementById('regionStatHubs').textContent = data.hubs;
    document.getElementById('regionStatSpeed').textContent = data.speed;

    // Update active tab button class
    mapButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.region === regionKey);
    });

    // Reset ALL nodes, routes, labels to inactive state
    routeLines.forEach(line => line.classList.remove('active'));
    hubNodes.forEach(node => {
      node.classList.remove('active');
      // Remove inline styles leftover from old code
      node.style.transform = '';
      node.style.filter = '';
    });
    // Reset labels
    allRegions.forEach(region => {
      const label = document.getElementById('label' + region.charAt(0).toUpperCase() + region.slice(1));
      if (label) label.classList.remove('active');
      const pulse = document.getElementById('pulse' + region.charAt(0).toUpperCase() + region.slice(1));
      if (pulse) pulse.classList.remove('active');
    });

    // Activate selected elements
    const activeRoute = document.getElementById(data.routeId);
    const activeNode = document.getElementById(data.nodeId);
    const labelId = 'label' + regionKey.charAt(0).toUpperCase() + regionKey.slice(1);
    const pulseId = 'pulse' + regionKey.charAt(0).toUpperCase() + regionKey.slice(1);
    const activeLabel = document.getElementById(labelId);
    const activePulse = document.getElementById(pulseId);

    if (activeRoute) activeRoute.classList.add('active');
    if (activeNode) activeNode.classList.add('active');
    if (activeLabel) activeLabel.classList.add('active');
    if (activePulse) activePulse.classList.add('active');

    // Flash landmass briefly
    if (landmass) {
      landmass.classList.add('highlighted');
      setTimeout(() => landmass.classList.remove('highlighted'), 800);
    }
  };

  mapButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      highlightRegion(btn.dataset.region);
    });
  });

  // Highlight nodes on SVG node clicks
  hubNodes.forEach(node => {
    node.addEventListener('click', () => {
      const regionKey = node.id.replace('node', '').toLowerCase();
      highlightRegion(regionKey);
    });
  });

  // Initial map highlight load
  highlightRegion('australia');


  // ==========================================
  // 10. Logistics Fleet Swapper Tabs
  // ==========================================
  const fleetButtons = document.querySelectorAll('.fleet-tab-btn');
  const fleetPanels = document.querySelectorAll('.fleet-panel');

  fleetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      fleetButtons.forEach(b => b.classList.remove('active'));
      fleetPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panelId = `fleet-${btn.dataset.fleet}`;
      const activePanel = document.getElementById(panelId);
      if (activePanel) activePanel.classList.add('active');
    });
  });


  // ==========================================
  // 11. Eco-Freight Carbon Calculator
  // ==========================================
  const ecoWeightSlider = document.getElementById('ecoWeightSlider');
  const ecoDistSlider = document.getElementById('ecoDistSlider');
  const ecoWeightVal = document.getElementById('ecoWeightVal');
  const ecoDistVal = document.getElementById('ecoDistVal');

  const barAir = document.getElementById('barAir');
  const barOcean = document.getElementById('barOcean');
  const barEco = document.getElementById('barEco');

  const valAir = document.getElementById('valAir');
  const valOcean = document.getElementById('valOcean');
  const valEco = document.getElementById('valEco');
  const ecoSavingsVal = document.getElementById('ecoSavingsVal');

  // Value animation helper for calculator counters
  const animateValue = (element, start, end, duration, formatFn) => {
    if (!element) return;
    const startTime = performance.now();

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing out quadratic
      const ease = progress * (2 - progress);
      const currentVal = start + (end - start) * ease;

      element.textContent = formatFn(currentVal);

      if (progress < 1) {
        element._animFrame = requestAnimationFrame(step);
      }
    };

    if (element._animFrame) {
      cancelAnimationFrame(element._animFrame);
    }
    element._animFrame = requestAnimationFrame(step);
  };

  let lastAir = 0;
  let lastOcean = 0;
  let lastEco = 0;
  let lastSavings = 0;
  let lastTrees = 0;

  const updateEcoMath = (isInitial = false) => {
    if (!ecoWeightSlider || !ecoDistSlider) return;

    const weight = parseFloat(ecoWeightSlider.value);
    const distance = parseFloat(ecoDistSlider.value);

    ecoWeightVal.textContent = `${weight.toLocaleString()} kg`;
    ecoDistVal.textContent = `${distance.toLocaleString()} km`;

    // Coefficients (kg CO2 per kg-km)
    const coeffAir = 0.0005;
    const coeffOcean = 0.000015;
    const coeffEco = 0.000022;

    // Calculation in Metric Tons
    const airTons = (weight * distance * coeffAir) / 1000;
    const oceanTons = (weight * distance * coeffOcean) / 1000;
    const ecoTons = (weight * distance * coeffEco) / 1000;
    const savings = airTons > 0 ? ((airTons - oceanTons) / airTons) * 100 : 0;

    // Trees Saved = Tons of CO2 saved / 0.022 (approx 22kg absorbed per tree per year)
    const tonsSaved = airTons - oceanTons;
    const trees = Math.max(Math.round(tonsSaved / 0.022), 0);

    const treesEl = document.getElementById('ecoTreesVal');

    if (isInitial) {
      valAir.textContent = `${airTons.toFixed(2)} T`;
      valOcean.textContent = `${oceanTons.toFixed(2)} T`;
      valEco.textContent = `${ecoTons.toFixed(2)} T`;
      ecoSavingsVal.textContent = `${savings.toFixed(1)}%`;
      if (treesEl) treesEl.textContent = trees.toLocaleString();
      lastAir = airTons;
      lastOcean = oceanTons;
      lastEco = ecoTons;
      lastSavings = savings;
      lastTrees = trees;
    } else {
      animateValue(valAir, lastAir, airTons, 300, v => `${v.toFixed(2)} T`);
      animateValue(valOcean, lastOcean, oceanTons, 300, v => `${v.toFixed(2)} T`);
      animateValue(valEco, lastEco, ecoTons, 300, v => `${v.toFixed(2)} T`);
      animateValue(ecoSavingsVal, lastSavings, savings, 300, v => `${v.toFixed(1)}%`);
      if (treesEl) {
        animateValue(treesEl, lastTrees, trees, 300, v => Math.round(v).toLocaleString());
      }
      lastAir = airTons;
      lastOcean = oceanTons;
      lastEco = ecoTons;
      lastSavings = savings;
      lastTrees = trees;
    }

    // Bar chart widths (scaled relative to air as 100%)
    if (barAir) barAir.style.width = '100%';
    if (barOcean) barOcean.style.width = `${Math.max((oceanTons / airTons) * 100, 3)}%`;
    if (barEco) barEco.style.width = `${Math.max((ecoTons / airTons) * 100, 4.5)}%`;
  };

  if (ecoWeightSlider) {
    ecoWeightSlider.addEventListener('input', () => updateEcoMath(false));
    ecoDistSlider.addEventListener('input', () => updateEcoMath(false));
    updateEcoMath(true); // Initial calculation
  }


  // ==========================================
  // 12. FAQ Accordion Click Handler
  // ==========================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const answer = item.querySelector('.faq-answer');

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other items
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        otherItem.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });


  // ==========================================
  // 13. Interactive Live AI Support Chatbot Widget
  // ==========================================
  const chatToggle = document.getElementById('chatToggle');
  const chatWindow = document.getElementById('chatWindow');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');

  let chatWidgetOpen = false;
  let botInitialGreetingSent = false;

  const appendChatMessage = (text, sender = 'bot', options = []) => {
    if (!chatMessages) return;

    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    msg.innerHTML = text.replace(/\n/g, '<br>');
    chatMessages.appendChild(msg);

    if (options.length > 0) {
      const optsContainer = document.createElement('div');
      optsContainer.className = 'chat-options';
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'chat-opt-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          appendChatMessage(opt.text, 'user');
          handleBotResponse(opt.value);
          optsContainer.remove(); // Clear options after click
        });
        optsContainer.appendChild(btn);
      });
      chatMessages.appendChild(optsContainer);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const handleBotResponse = async (inputVal) => {
    const msgVal = inputVal.trim().toLowerCase();

    // Simulate typing latency
    const typingMsg = document.createElement('div');
    typingMsg.className = 'chat-msg bot';
    typingMsg.textContent = 'Typing...';
    chatMessages.appendChild(typingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(async () => {
      typingMsg.remove();

      if (msgVal.includes('track') || msgVal === 'opt_track') {
        appendChatMessage("Please enter a 10-digit consignment code starting with 'SKY-' (e.g. SKY-102948 or SKY-987654) to query our shipping database.");
      } else if (msgVal.startsWith('sky-')) {
        const code = inputVal.trim().toUpperCase();
        try {
          const res = await fetch(`/api/shipments/track/${encodeURIComponent(code)}`);
          const result = await res.json();
          if (result.success && result.data) {
            const s = result.data;
            const eventStr = s.events[0]
              ? `${s.events[0].title}: ${s.events[0].desc}`
              : 'No tracking status updates logged.';
            appendChatMessage(`<strong>Shipment Found!</strong><br>Code: ${s.trackingCode}<br>Status: <strong>${s.status}</strong><br>Origin: ${s.origin}<br>Destination: ${s.destination}<br>Latest update: ${eventStr}`);
          } else {
            appendChatMessage(`Could not find shipment with code <strong>${code}</strong>. Try clicking one of the sample codes on the Track page or verify your consignment ID.`);
          }
        } catch (err) {
          appendChatMessage("Apologies, I encountered an error connecting to our tracking database. Please try again shortly.");
        }
      } else if (msgVal.includes('weight') || msgVal === 'opt_weight') {
        appendChatMessage("Volumetric weight is computed as: (Length x Width x Height in cm) / 5000. For example, a package measuring 50x40x30 cm is charged as 12.0 kg if its physical weight is less than that.");
      } else if (msgVal.includes('contact') || msgVal === 'opt_contact') {
        appendChatMessage("You can reach us at:<br>📧 operations@skynetgloballogistics.com<br>📞 +61 2 7235 5780<br>Our business hours are Mon-Fri 9am-5pm AEST.");
      } else {
        appendChatMessage("I'm here to assist with tracking, cargo details, or customer inquiries. How can I help you?", 'bot', [
          { text: "🔍 Track a Shipment", value: "opt_track" },
          { text: "📦 Volumetric Weight FAQ", value: "opt_weight" },
          { text: "📞 Contact Support Agent", value: "opt_contact" }
        ]);
      }
    }, 600);
  };

  const toggleChatWindow = () => {
    chatWidgetOpen = !chatWidgetOpen;
    chatToggle.classList.toggle('open', chatWidgetOpen);
    chatWindow.classList.toggle('open', chatWidgetOpen);

    if (chatWidgetOpen && !botInitialGreetingSent) {
      botInitialGreetingSent = true;
      appendChatMessage("Hello! Welcome to Skynet Global Logistics. I am your Live Support Assistant.", 'bot', [
        { text: "🔍 Track a Shipment", value: "opt_track" },
        { text: "📦 Volumetric Weight FAQ", value: "opt_weight" },
        { text: "📞 Contact Support Agent", value: "opt_contact" }
      ]);
    }
  };

  if (chatToggle) {
    chatToggle.addEventListener('click', toggleChatWindow);

    chatSendBtn.addEventListener('click', () => {
      const val = chatInput.value.trim();
      if (!val) return;
      appendChatMessage(val, 'user');
      chatInput.value = '';
      handleBotResponse(val);
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const val = chatInput.value.trim();
        if (!val) return;
        appendChatMessage(val, 'user');
        chatInput.value = '';
        handleBotResponse(val);
      }
    });
  }

  // ==========================================
  // 14. Premium Subtle Animations & Interactivity
  // ==========================================

  // Card Mouse Glow coordinate tracking
  const glowCards = document.querySelectorAll('.glass-card, .service-card');
  glowCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // Ambient Glow scroll parallax drift
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        const glowBlobs = document.querySelectorAll('.ambient-glow');
        glowBlobs.forEach((glow, idx) => {
          const speed = (idx + 1) * 0.15;
          glow.style.transform = `translateY(${scrolled * speed}px)`;
        });
        scrollTimeout = null;
      });
      scrollTimeout = true;
    }
  }, { passive: true });

  // ==========================================
  // 15. Global Timezone Clocks
  // ==========================================
  const updateClocks = () => {
    const clockData = [
      { id: 'clockNY', tz: 'America/New_York' },
      { id: 'clockFR', tz: 'Europe/Berlin' },
      { id: 'clockSG', tz: 'Asia/Singapore' },
      { id: 'clockSH', tz: 'Asia/Shanghai' },
      { id: 'clockSYD', tz: 'Australia/Sydney' },
      { id: 'clockDB', tz: 'Asia/Dubai' }
    ];
    clockData.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) {
        try {
          el.textContent = new Date().toLocaleTimeString('en-US', {
            timeZone: item.tz,
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        } catch (err) {
          // Fallback if timezone formatting fails
          el.textContent = new Date().toLocaleTimeString();
        }
      }
    });
  };
  setInterval(updateClocks, 1000);
  updateClocks();

  // ==========================================
  // 16. Career Accordion
  // ==========================================
  const careerItems = document.querySelectorAll('.career-item');
  careerItems.forEach(item => {
    const trigger = item.querySelector('.career-trigger');
    const details = item.querySelector('.career-details');

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close other active jobs
      careerItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        otherItem.querySelector('.career-details').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        details.style.maxHeight = `${details.scrollHeight}px`;
      }
    });
  });

  // Resume Drag and Drop / Choose File simulation
  const dropzones = [
    { zone: document.getElementById('dropzone1'), file: document.getElementById('fileInput1'), submit: document.getElementById('applySubmit1') },
    { zone: document.getElementById('dropzone2'), file: document.getElementById('fileInput2'), submit: document.getElementById('applySubmit2') }
  ];

  dropzones.forEach(dz => {
    if (!dz.zone) return;

    dz.zone.addEventListener('click', () => dz.file.click());

    dz.file.addEventListener('change', () => {
      if (dz.file.files.length > 0) {
        dz.zone.classList.add('has-file');
        dz.zone.querySelector('span').textContent = `File selected: ${dz.file.files[0].name}`;
      }
    });

    // Drag-over styling
    dz.zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.zone.classList.add('dragover');
    });

    dz.zone.addEventListener('dragleave', () => {
      dz.zone.classList.remove('dragover');
    });

    dz.zone.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.zone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        dz.file.files = e.dataTransfer.files;
        dz.zone.classList.add('has-file');
        dz.zone.querySelector('span').textContent = `File dropped: ${e.dataTransfer.files[0].name}`;
      }
    });

    dz.submit.addEventListener('click', () => {
      if (dz.file.files.length === 0) {
        alert("Please upload your resume (PDF) first.");
        return;
      }
      alert("Application submitted successfully! Thank you for applying to Skynet Global Logistics.");
      dz.zone.classList.remove('has-file');
      dz.zone.querySelector('span').textContent = "Drag & drop resume (PDF) or click to browse";
      dz.file.value = "";
    });
  });

  // ==========================================
  // 17. Partner Onboarding Form Progress
  // ==========================================
  const nextBtn = document.getElementById('onboardingNext1');
  const prevBtn = document.getElementById('onboardingPrev1');
  const onboardingForm = document.getElementById('partnerOnboardingForm');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      // Validate step 1 fields
      const company = document.getElementById('partnerCompany');
      const region = document.getElementById('partnerRegion');
      if (!company.value || !region.value) {
        alert("Please complete all step 1 fields.");
        return;
      }

      // Transition to step 2
      document.querySelector('.onboarding-step-view[data-step="1"]').style.display = 'none';
      document.querySelector('.onboarding-step-view[data-step="2"]').style.display = 'block';
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      document.querySelector('.onboarding-step-view[data-step="2"]').style.display = 'none';
      document.querySelector('.onboarding-step-view[data-step="1"]').style.display = 'block';
    });
  }

  if (onboardingForm) {
    onboardingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Transition to success screen
      document.querySelector('.onboarding-step-view[data-step="2"]').style.display = 'none';
      document.querySelector('.onboarding-step-view[data-step="3"]').style.display = 'block';
    });
  }

  // ==========================================
  // 18. Hero Section Premium Text Entrance & Rotator
  // ==========================================
  const titleLine = document.getElementById('hero-title-line-1');
  if (titleLine) {
    const text = titleLine.textContent.trim();
    titleLine.innerHTML = '';
    const words = text.split(' ');
    let charCount = 0;

    words.forEach((word, wordIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.whiteSpace = 'nowrap';
      wordSpan.style.display = 'inline-block';

      [...word].forEach((char) => {
        const span = document.createElement('span');
        span.className = 'hero-char';
        span.textContent = char;
        span.style.setProperty('--char-idx', charCount++);
        wordSpan.appendChild(span);
      });

      titleLine.appendChild(wordSpan);

      // Add space between words (but not after the last word)
      if (wordIdx < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.innerHTML = '&nbsp;';
        titleLine.appendChild(spaceSpan);
        charCount++;
      }
    });
  }

  const rotator = document.getElementById('hero-rotator');
  if (rotator) {
    const words = ['Excellence', 'Efficiency', 'Reliability', 'Connectivity'];
    let index = 0;

    // Start rotation loop after initial entrance animation completes (approx 2.5s)
    setTimeout(() => {
      setInterval(() => {
        // Exit stage: slides up and out (representing shipment departure/transit)
        rotator.classList.remove('active');
        rotator.classList.add('exit');

        setTimeout(() => {
          // Swap keyword while invisible
          index = (index + 1) % words.length;
          rotator.textContent = words[index];
          rotator.classList.remove('exit');
          rotator.classList.add('enter');

          // Trigger reflow to apply entry style instantly
          rotator.offsetHeight;

          // Enter stage: slides up from bottom into position (representing shipment arrival/delivery)
          rotator.classList.remove('enter');
          rotator.classList.add('active');
        }, 500); // matches the css transition duration
      }, 4000); // time each keyword remains active
    }, 2500);
  }



});

