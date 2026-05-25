gsap.registerPlugin(ScrollTrigger, TextPlugin);

document.addEventListener('DOMContentLoaded', () => {
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const isMobile = window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { current: 'countdown-screen', cakeCut: false, assetsReady: false };

  const screens = qsa('[data-screen]');
  const particleField = qs('#particle-field');
  const cursorGlow = qs('.cursor-glow');

  const assets = {
    images: [
      'assets/images/photo-01.jpg',
      'assets/images/photo-02.jpg',
      'assets/images/photo-03.jpg',
      'assets/images/cake.png'
    ],
    audio: {
      music: 'assets/audio/ambient.mp3',
      cut: 'assets/audio/cake-cut.mp3',
      click: 'assets/audio/click.mp3',
      swoosh: 'assets/audio/swoosh.mp3'
    }
  };

  const audioController = {
    unlocked: false,
    nodes: {},
    init() {
      Object.entries(assets.audio).forEach(([key, src]) => {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = key === 'music' ? 0 : 0.55;
        audio.loop = key === 'music';
        this.nodes[key] = audio;
      });
    },
    unlock() {
      if (this.unlocked) return;
      this.unlocked = true;
      const music = this.nodes.music;
      if (!music) return;
      music.play().then(() => {
        gsap.to(music, { volume: 0.22, duration: 3.2, ease: 'power2.out' });
      }).catch(() => {});
    },
    play(key, volume = 0.5) {
      const audio = this.nodes[key];
      if (!audio || !this.unlocked) return;
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(() => {});
    }
  };

  function createAtmosphere() {
    const particleCount = isMobile ? 32 : 72;
    const heartCount = isMobile ? 7 : 16;

    // Lightweight ambient elements are animated only with transform and opacity for mobile GPU safety.
    for (let i = 0; i < particleCount; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'particle';
      dot.style.setProperty('--x', `${Math.random() * 100}%`);
      dot.style.setProperty('--y', `${Math.random() * 100}%`);
      dot.style.setProperty('--size', `${Math.random() * 3 + 1.5}px`);
      dot.style.setProperty('--alpha', `${Math.random() * 0.46 + 0.16}`);
      particleField.appendChild(dot);
      gsap.to(dot, {
        y: gsap.utils.random(-90, 90),
        x: gsap.utils.random(-42, 42),
        opacity: gsap.utils.random(0.16, 0.72),
        duration: gsap.utils.random(5, 10),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 4
      });
    }

    for (let i = 0; i < heartCount; i += 1) {
      const heart = document.createElement('span');
      heart.className = 'heart';
      heart.textContent = '♥';
      heart.style.setProperty('--x', `${Math.random() * 100}%`);
      heart.style.setProperty('--y', `${Math.random() * 100}%`);
      heart.style.setProperty('--size', `${Math.random() * 1.2 + 0.8}rem`);
      particleField.appendChild(heart);
      gsap.to(heart, {
        y: gsap.utils.random(-70, 70),
        x: gsap.utils.random(-35, 35),
        rotation: gsap.utils.random(-16, 16),
        opacity: gsap.utils.random(0.12, 0.42),
        duration: gsap.utils.random(6, 12),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 4
      });
    }

    gsap.to('.orb-one', { x: '8vw', y: '5vh', scale: 1.08, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.orb-two', { x: '-7vw', y: '-4vh', scale: 1.12, duration: 11, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.orb-three', { x: '4vw', y: '-6vh', scale: 0.94, duration: 9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.light-leak', { x: '24vw', duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 2 });
  }

  function splitText() {
    qsa('[data-split]').forEach((node) => {
      const words = node.textContent.trim().split(' ');
      node.innerHTML = words.map((word) => `<span class="word"><span>${word}</span></span>`).join(' ');
    });
  }

  function preloadAssets(onProgress) {
    // Missing placeholder assets resolve as ready, so the cinematic sequence never blocks in development.
    const imagePromises = assets.images.map((src) => new Promise((resolve) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = src;
    }));

    const audioPromises = Object.values(audioController.nodes).map((audio) => new Promise((resolve) => {
      const done = () => resolve();
      audio.addEventListener('canplaythrough', done, { once: true });
      audio.addEventListener('error', done, { once: true });
      audio.load();
      setTimeout(done, 1500);
    }));

    const all = [...imagePromises, ...audioPromises];
    let loaded = 0;
    all.forEach((promise) => promise.then(() => {
      loaded += 1;
      onProgress(loaded / all.length);
    }));
    return Promise.all(all);
  }

  function showScreen(id) {
    if (state.current === id) return;
    const current = qs(`#${state.current}`);
    const next = qs(`#${id}`);
    state.current = id;
    audioController.play('swoosh', 0.32);

    // A single transition timeline keeps every screen change feeling directed instead of abrupt.
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .to(current, { opacity: 0, scale: 0.985, duration: 0.9, pointerEvents: 'none' })
      .set(current, { visibility: 'hidden' })
      .set(next, { visibility: 'visible', opacity: 0, scale: 1.025, pointerEvents: 'auto' })
      .add(() => {
        screens.forEach((screen) => screen.classList.toggle('is-active', screen.id === id));
      })
      .to(next, { opacity: 1, scale: 1, duration: 1.1 }, '<0.08')
      .add(() => runScreenIntro(id), '<0.15');
  }

  function runScreenIntro(id) {
    if (id === 'intro-screen') {
      gsap.fromTo('#intro-screen .word span', { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.15, stagger: 0.055, ease: 'expo.out' });
      gsap.fromTo('#intro-screen .lux-button', { y: 28, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.5)', delay: 0.55 });
      gsap.to('#intro-screen .word:nth-child(2) span, #intro-screen .word:nth-child(5) span', { color: '#d96788', textShadow: '0 0 28px rgba(255,255,255,.7)', duration: 1.2, yoyo: true, repeat: 1, delay: 0.7 });
    }

    if (id === 'cake-screen') {
      gsap.fromTo('.cake-heading', { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out' });
      gsap.fromTo('.cake-stage', { y: 46, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 1.15, ease: 'expo.out', delay: 0.14 });
    }

    if (id === 'photo-screen') {
      gsap.fromTo('#photo-screen .word span', { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.05, ease: 'expo.out' });
      gsap.fromTo('.polaroid', { y: 90, opacity: 0, scale: 0.88 }, { y: 0, opacity: 1, scale: 1, duration: 1.15, stagger: 0.13, ease: 'back.out(1.25)' });
      gsap.fromTo('#photo-screen .text-button', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.65 });
    }

    if (id === 'message-screen') {
      gsap.fromTo('#message-screen .word span', { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.06, ease: 'expo.out' });
      gsap.fromTo('.message-line', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.05, stagger: 0.38, ease: 'power3.out', delay: 0.5 });
    }
  }

  function runCountdown() {
    const number = qs('.countdown-number');
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => showScreen('loading-screen') });
    ['3', '2', '1'].forEach((value) => {
      tl.set(number, { text: value, scale: 0.72, opacity: 0, y: 34 })
        .to(number, { scale: 1, opacity: 1, y: 0, duration: 0.52 })
        .to('.heartbeat', { scale: 1.24, opacity: 0.16, duration: 0.42, ease: 'power2.out' }, '<')
        .to('.heartbeat', { scale: 1, opacity: 0.62, duration: 0.38, ease: 'power2.inOut' })
        .to(number, { scale: 1.08, opacity: 0, y: -30, duration: 0.42, ease: 'power3.in' }, '+=0.1');
    });
  }

  function runLoading() {
    const fill = qs('.loading-fill');
    const shimmer = gsap.to('.loading-crown span', { scaleY: 0.48, duration: 0.7, repeat: -1, yoyo: true, stagger: 0.12, ease: 'sine.inOut' });
    preloadAssets((progress) => gsap.to(fill, { width: `${Math.round(progress * 100)}%`, duration: 0.35, ease: 'power2.out' }))
      .then(() => {
        state.assetsReady = true;
        gsap.to(fill, { width: '100%', duration: 0.35, ease: 'power2.out' });
        gsap.delayedCall(0.7, () => {
          shimmer.kill();
          showScreen('intro-screen');
        });
      });
  }

  function cutCake() {
    if (state.cakeCut) return;
    state.cakeCut = true;
    audioController.play('cut', 0.62);

    // Confetti is intentionally capped on mobile and self-cleans through canvas-confetti.
    const confettiCount = isMobile ? 90 : 170;
    confetti({ particleCount: confettiCount, spread: 82, origin: { y: 0.58 }, colors: ['#f7a9bd', '#ffe7b7', '#d9c7ff', '#ffffff'], disableForReducedMotion: true });
    setTimeout(() => confetti({ particleCount: Math.floor(confettiCount * 0.45), angle: 60, spread: 60, origin: { x: 0.12, y: 0.72 } }), 160);
    setTimeout(() => confetti({ particleCount: Math.floor(confettiCount * 0.45), angle: 120, spread: 60, origin: { x: 0.88, y: 0.72 } }), 220);

    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to('.cut-line', { opacity: 1, scaleY: 1.15, duration: 0.18 })
      .to('.cake-left', { x: -72, y: 18, rotation: -10, duration: 1.15 }, '<0.04')
      .to('.cake-right', { x: 72, y: 18, rotation: 10, duration: 1.15 }, '<')
      .to('.cake-halo', { scale: 1.35, opacity: 0.88, duration: 0.55 }, '<')
      .to('.cake-heading', { text: 'Happy Birthday, My Girl!', color: '#d96788', scale: 1.05, duration: 0.7 }, '<0.08')
      .to('.gesture-hint', { opacity: 0, y: 12, duration: 0.35 }, '<')
      .to('.cake-next', { opacity: 1, pointerEvents: 'auto', y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.5)' }, '+=1.25');
  }

  function bindInteractions() {
    document.addEventListener('pointermove', (event) => {
      if (!isMobile && cursorGlow) {
        gsap.to(cursorGlow, { x: event.clientX, y: event.clientY, duration: 0.45, ease: 'power3.out' });
      }

      if (state.current === 'cake-screen' && !state.cakeCut) {
        const x = (event.clientX / window.innerWidth - 0.5) * 14;
        const y = (event.clientY / window.innerHeight - 0.5) * 10;
        gsap.to('.cake-stage', { x, y, rotateY: x * 0.25, rotateX: -y * 0.2, duration: 0.5, ease: 'power3.out' });
      }
    });

    qsa('.magnetic').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        gsap.to(button, { x, y, scale: 1.035, duration: 0.35, ease: 'power3.out' });
      });
      button.addEventListener('pointerleave', () => gsap.to(button, { x: 0, y: 0, scale: 1, duration: 0.55, ease: 'elastic.out(1, .45)' }));
      button.addEventListener('click', () => audioController.play('click', 0.38));
    });

    qsa('[data-action="start-surprise"]').forEach((button) => button.addEventListener('click', () => {
      audioController.unlock();
      showScreen('cake-screen');
    }));
    qsa('[data-action="show-photos"]').forEach((button) => button.addEventListener('click', () => showScreen('photo-screen')));
    qsa('[data-action="open-message"]').forEach((button) => button.addEventListener('click', () => showScreen('message-screen')));

    const cakeScreen = qs('#cake-screen');
    let startX = 0;
    let startY = 0;
    cakeScreen.addEventListener('pointerdown', (event) => {
      startX = event.clientX;
      startY = event.clientY;
    });
    cakeScreen.addEventListener('pointerup', (event) => {
      const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
      if (distance > 24 || event.target.closest('.cake-stage')) cutCake();
    });
  }

  function loopIdleMotion() {
    gsap.to('.cake-stage', { y: -12, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.cake-halo', { scale: 1.08, opacity: 0.68, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.polaroid', { y: -12, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.35 });
  }

  function init() {
    audioController.init();
    splitText();
    createAtmosphere();
    bindInteractions();
    if (!reduceMotion) loopIdleMotion();
    runCountdown();
    const loadingObserver = new MutationObserver(() => {
      if (qs('#loading-screen').classList.contains('is-active') && !state.assetsReady) {
        loadingObserver.disconnect();
        runLoading();
      }
    });
    loadingObserver.observe(qs('#loading-screen'), { attributes: true, attributeFilter: ['class'] });
  }

  init();
});
