/* ═══════════════════════════════════════════════
   Active & Attractive — main.js
   Three.js 3D bg + product viewer + scroll FX
════════════════════════════════════════════════ */

'use strict';

/* ─── UTILITIES ─── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ══════════════════════════════════════════════
   1. BACKGROUND 3D SCENE (floating particles + grid)
══════════════════════════════════════════════ */
(function initBgScene() {
  const canvas = qs('#bg-canvas');
  if (!canvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 30);

  /* ── Particles ── */
  const PARTICLE_COUNT = 1800;
  const positions  = new Float32Array(PARTICLE_COUNT * 3);
  const colors     = new Float32Array(PARTICLE_COUNT * 3);
  const sizes      = new Float32Array(PARTICLE_COUNT);

  const colA = new THREE.Color(0x5b8db8);   // steel blue
  const colB = new THREE.Color(0xc8d8e8);   // chrome
  const colC = new THREE.Color(0x1e3a5f);   // dark blue

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = 50 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const mix = Math.random();
    const col = mix < 0.4 ? colA : mix < 0.7 ? colB : colC;
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
    sizes[i] = 0.08 + Math.random() * 0.25;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* ── Grid lines ── */
  const gridGroup = new THREE.Group();
  const lineMat   = new THREE.LineBasicMaterial({
    color: 0x2a5070,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
  });

  const GRID_SIZE = 60;
  const GRID_STEP = 8;
  for (let i = -GRID_SIZE; i <= GRID_SIZE; i += GRID_STEP) {
    // horizontal
    let pts = [ new THREE.Vector3(-GRID_SIZE, 0, i), new THREE.Vector3(GRID_SIZE, 0, i) ];
    gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    // vertical
    pts = [ new THREE.Vector3(i, 0, -GRID_SIZE), new THREE.Vector3(i, 0, GRID_SIZE) ];
    gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }
  gridGroup.position.y = -20;
  gridGroup.rotation.x = Math.PI / 10;
  scene.add(gridGroup);

  /* ── Floating rings ── */
  const rings = [];
  const ringColors = [0x5b8db8, 0x7fb3d8, 0xc8d8e8];
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.TorusGeometry(6 + i * 4, 0.04, 8, 80);
    const mat = new THREE.MeshBasicMaterial({
      color: ringColors[i % 3],
      transparent: true,
      opacity: 0.08 + Math.random() * 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20 - 20
    );
    ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    ring.userData = { rx: (Math.random() - 0.5) * 0.003, ry: (Math.random() - 0.5) * 0.003 };
    rings.push(ring);
    scene.add(ring);
  }

  /* ── Mouse parallax ── */
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── Scroll ── */
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  /* ── Animate ── */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.005;

    particles.rotation.y += 0.0005;
    particles.rotation.x  = mouse.y * 0.05;

    gridGroup.position.y = -20 - scrollY * 0.01;
    gridGroup.rotation.x = Math.PI / 10 + scrollY * 0.0002;

    camera.position.x += (mouse.x * 3 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 2 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    rings.forEach((r, i) => {
      r.rotation.x += r.userData.rx;
      r.rotation.y += r.userData.ry;
      r.material.opacity = (0.06 + Math.abs(Math.sin(t + i)) * 0.1);
    });

    renderer.render(scene, camera);
  }
  animate();
})();

/* ══════════════════════════════════════════════
   2. PRODUCT 3D VIEWER (draggable rotating cube)
══════════════════════════════════════════════ */
(function initProductViewer() {
  const canvas = qs('#product-canvas');
  if (!canvas || !window.THREE) return;

  const W = canvas.parentElement.clientWidth;
  const H = canvas.parentElement.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0, 5);

  /* Lights */
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  const keyLight = new THREE.DirectionalLight(0xc8d8e8, 2);
  keyLight.position.set(3, 4, 3);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x5b8db8, 1.5);
  rimLight.position.set(-3, -2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x7fb3d8, 1, 15);
  fillLight.position.set(0, 3, 2);
  scene.add(fillLight);

  /* Build a stylised hoodie-like form using geometry */
  const group = new THREE.Group();

  // body
  const bodyGeo = new THREE.BoxGeometry(1.4, 1.8, 0.6, 4, 4, 2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f1a,
    roughness: 0.6,
    metalness: 0.2,
    envMapIntensity: 1,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = -0.2;
  body.castShadow = true;
  group.add(body);

  // sleeves
  [-1, 1].forEach(side => {
    const sleeveGeo = new THREE.CylinderGeometry(0.28, 0.22, 1.3, 10);
    const sleeve = new THREE.Mesh(sleeveGeo, bodyMat);
    sleeve.position.set(side * 0.93, -0.18, 0);
    sleeve.rotation.z = side * (Math.PI / 3.5);
    sleeve.castShadow = true;
    group.add(sleeve);
  });

  // hood
  const hoodGeo = new THREE.SphereGeometry(0.55, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.65);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.position.y = 0.85;
  group.add(hood);

  // logo patch (emissive blue square on chest)
  const patchGeo = new THREE.PlaneGeometry(0.5, 0.5);
  const patchMat = new THREE.MeshStandardMaterial({
    color: 0x5b8db8,
    emissive: 0x2a5070,
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.5,
  });
  const patch = new THREE.Mesh(patchGeo, patchMat);
  patch.position.set(0, -0.1, 0.31);
  group.add(patch);

  // chrome zipper
  const zipGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8);
  const zipMat = new THREE.MeshStandardMaterial({ color: 0xc8d8e8, metalness: 0.95, roughness: 0.1 });
  const zipper = new THREE.Mesh(zipGeo, zipMat);
  zipper.position.set(0, -0.2, 0.31);
  group.add(zipper);

  scene.add(group);

  /* Floor reflection plane */
  const floorGeo = new THREE.PlaneGeometry(10, 10);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 1, metalness: 0 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* Drag rotation */
  let isDragging = false;
  let prevX = 0, prevY = 0;
  let rotX = 0, rotY = 0;
  let velX = 0, velY = 0;

  canvas.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
  canvas.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; });

  window.addEventListener('mouseup',   () => { isDragging = false; });
  window.addEventListener('touchend',  () => { isDragging = false; });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    velX = (e.clientX - prevX) * 0.01;
    velY = (e.clientY - prevY) * 0.01;
    rotY += velX;
    rotX += velY;
    prevX = e.clientX; prevY = e.clientY;
  });

  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    velX = (e.touches[0].clientX - prevX) * 0.01;
    velY = (e.touches[0].clientY - prevY) * 0.01;
    rotY += velX;
    rotX += velY;
    prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
  });

  /* Resize */
  const resizeObserver = new ResizeObserver(() => {
    const W2 = canvas.parentElement.clientWidth;
    const H2 = canvas.parentElement.clientHeight;
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
    renderer.setSize(W2, H2);
  });
  resizeObserver.observe(canvas.parentElement);

  /* Animate */
  let pt = 0;
  function animateProd() {
    requestAnimationFrame(animateProd);
    pt += 0.008;

    if (!isDragging) {
      velX *= 0.92;
      velY *= 0.92;
      rotY += velX;
      rotX += velY;
      rotY += 0.005; // auto-spin
    }

    rotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotX));
    group.rotation.y = rotX;
    group.rotation.x = -rotY;
    group.position.y = Math.sin(pt) * 0.12;

    fillLight.position.x = Math.sin(pt) * 3;
    fillLight.intensity = 0.8 + Math.abs(Math.sin(pt * 0.7)) * 0.8;

    renderer.render(scene, camera);
  }
  animateProd();
})();

/* ══════════════════════════════════════════════
   3. NAV SCROLL BEHAVIOUR
══════════════════════════════════════════════ */
(function initNav() {
  const nav  = qs('#navbar');
  const ham  = qs('#hamburger');
  const menu = qs('#mobileMenu');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  ham.addEventListener('click', () => {
    ham.classList.toggle('open');
    menu.classList.toggle('open');
  });

  qsa('.mobile-link').forEach(a => {
    a.addEventListener('click', () => {
      ham.classList.remove('open');
      menu.classList.remove('open');
    });
  });
})();

/* ══════════════════════════════════════════════
   4. SCROLL REVEAL
══════════════════════════════════════════════ */
(function initReveal() {
  const els = qsa('.reveal-up, .reveal-left, .reveal-right, .reveal-card');

  const getDelay = el => parseFloat(el.dataset.delay || 0) * 1000;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        setTimeout(() => el.classList.add('visible'), getDelay(el));
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  els.forEach(el => io.observe(el));
})();

/* ══════════════════════════════════════════════
   5. COUNTER ANIMATION (stats section)
══════════════════════════════════════════════ */
(function initCounters() {
  const counters = qsa('.stat-num[data-target]');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const animate = (el, target, duration = 2000) => {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      el.textContent = Math.floor(easeOut(progress) * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animate(el, parseInt(el.dataset.target));
        io.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));
})();

/* ══════════════════════════════════════════════
   6. TILT EFFECT ON CARDS
══════════════════════════════════════════════ */
(function initTilt() {
  const cards = qsa('[data-tilt]');
  const MAX_TILT = 8;

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `
        perspective(800px)
        rotateX(${-y * MAX_TILT}deg)
        rotateY(${x * MAX_TILT}deg)
        translateY(-8px)
        scale(1.01)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
})();

/* ══════════════════════════════════════════════
   7. PARALLAX ON HERO TEXT
══════════════════════════════════════════════ */
(function initParallax() {
  const heroContent = qs('.hero-content');
  if (!heroContent) return;

  const strength = parseFloat(heroContent.dataset.parallax || 0.3);

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroContent.style.transform = `translateY(${y * strength}px)`;
    heroContent.style.opacity   = Math.max(0, 1 - y / window.innerHeight * 1.4);
  }, { passive: true });
})();

/* ══════════════════════════════════════════════
   8. CART FUNCTIONALITY
══════════════════════════════════════════════ */
(function initCart() {
  const cartBtn     = qs('.cart-btn');
  const cartDrawer  = qs('#cartDrawer');
  const cartOverlay = qs('#cartOverlay');
  const cartClose   = qs('#cartClose');
  const cartItems   = qs('#cartItems');
  const cartTotal   = qs('#cartTotal');
  const cartCount   = qs('.cart-count');

  let cart = [];

  const openCart  = () => { cartDrawer.classList.add('open'); cartOverlay.classList.add('show'); };
  const closeCart = () => { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('show'); };

  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  const renderCart = () => {
    const total = cart.reduce((s, i) => s + i.price, 0);
    cartTotal.textContent = `$${total}`;

    const count = cart.length;
    cartCount.textContent = count;
    cartCount.classList.toggle('visible', count > 0);

    if (!cart.length) {
      cartItems.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      return;
    }

    cartItems.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price}</div>
        </div>
        <button class="cart-remove icon-btn" data-index="${i}" aria-label="Remove">✕</button>
      </div>
    `).join('');

    qsa('.cart-remove', cartItems).forEach(btn => {
      btn.addEventListener('click', () => {
        cart.splice(parseInt(btn.dataset.index), 1);
        renderCart();
      });
    });
  };

  /* Quick add buttons */
  const bindQuickAdd = () => {
    qsa('.quick-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const name  = btn.dataset.name;
        const price = parseInt(btn.dataset.price);
        cart.push({ name, price });
        renderCart();
        showToast(`${name} added to cart`);
        openCart();
      });
    });
  };

  bindQuickAdd();
  renderCart();
})();

/* ══════════════════════════════════════════════
   9. TOAST NOTIFICATION
══════════════════════════════════════════════ */
function showToast(msg, duration = 3000) {
  const toast = qs('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ══════════════════════════════════════════════
   10. NEWSLETTER FORM
══════════════════════════════════════════════ */
(function initNewsletter() {
  const form = qs('#newsletterForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    showToast(`You're in! Watch your inbox for the next drop.`);
    input.value = '';
  });
})();

/* ══════════════════════════════════════════════
   11. SMOOTH ANCHOR SCROLL
══════════════════════════════════════════════ */
(function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = qs(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
      const top  = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ══════════════════════════════════════════════
   12. PAGE LOAD ENTRANCE ANIMATION
══════════════════════════════════════════════ */
(function initEntrance() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.8s ease';

  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });
})();
