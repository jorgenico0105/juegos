/*
 * ILE · Juegos para tótem LCD (1080x1920, táctil, Android 7.1.2).
 * Escrito en ES5 a propósito: el WebView de Android 7 puede ser antiguo.
 * No usar arrow functions, let/const, template literals, ni APIs recientes.
 */
(function () {
  'use strict';

  /* =============================== CONTENIDO =============================== */

  var CONFIG = {
    idleMs: 75000,           // sin toques durante este tiempo -> vuelve al inicio
    tourSlideMs: 8000,       // duración mínima de cada pantalla en "Conoce ILE"
    tourPhotoMs: 3000,       // tiempo de cada foto en las pantallas con varias fotos
    triviaFeedbackMs: 15000, // si nadie elige "Siguiente" o "Terminar", pasa a "Gracias"
    thanksMs: 10000,         // pantalla "Gracias" antes de volver al inicio
    memoryWinMs: 20000,      // pantalla "Lo lograste" antes de volver al inicio
    memoryMismatchMs: 950,   // tiempo que se ven dos cartas distintas
    memoryPairs: 6,          // productos por partida (se eligen al azar de PRODUCTS)
    memoryCols: 3            // columnas de la grilla (6 pares = 12 cartas = 3x4)
  };

  // Productos del juego de memoria (assets/productos/<id>.webp).
  // En cada partida se usan CONFIG.memoryPairs de ellos, elegidos al azar.
  var PRODUCTS = [
    { id: 'aji-criollo', name: 'Salsa de Ají Criollo' },
    { id: 'adobo-completo', name: 'Adobo Completo' },
    { id: 'sabora-menestra', name: 'Sabora Menestra' },
    { id: 'refrito', name: 'Refrito' },
    { id: 'sabora-pollo', name: 'Sabora Pollo' },
    { id: 'salsa-bbq', name: 'Salsa BBQ Picante' },
    { id: 'meruvilla-jamaica', name: 'Meruvilla Flor de Jamaica' },
    { id: 'sabrocitos-platanito', name: 'Sabrocitos Platanito' },
    { id: 'meruvilla-pina-uvilla', name: 'Meruvilla Piña con Uvilla' },
    { id: 'sabora-condimento', name: 'Sabora Condimento' }
  ];

  // Trivia: preguntas del brief de Marketing. correct = índice (0 = A, 1 = B)
  var QUESTIONS = [
    { q: '¿Quién es responsable de cuidar la inocuidad?',
      a: ['Solo el área de Calidad', 'Todas las áreas'], correct: 1,
      msg: 'Cada persona contribuye a elaborar alimentos seguros.' },
    { q: '¿Para qué sirve el número de lote?',
      a: ['Para indicar el precio', 'Para identificar su producción'], correct: 1,
      msg: 'El lote permite rastrear la historia del producto.' },
    { q: '¿La calidad se cuida únicamente al finalizar la producción?',
      a: ['Sí', 'No, en todas las etapas'], correct: 1,
      msg: 'La calidad comienza en las materias primas y se cuida durante todo el proceso.' },
    { q: '¿Qué significa inocuidad alimentaria?',
      a: ['Que el alimento tenga buen sabor', 'Que sea seguro para su consumo'], correct: 1,
      msg: 'Un alimento inocuo no causa daño cuando se prepara y consume según su uso previsto.' },
    { q: 'En CLAS, ¿qué significa Legalidad?',
      a: ['Cumplir los requisitos legales aplicables', 'Cumplir solo lo que pide el cliente'], correct: 0,
      msg: 'La legalidad forma parte de nuestro compromiso.' },
    { q: '¿Qué demuestra una cultura de inocuidad?',
      a: ['Cuidar el alimento incluso sin supervisión', 'Aplicar los controles solo en auditorías'], correct: 0,
      msg: 'La cultura se refleja en lo que hacemos cada día.' },
    { q: '¿Qué significa que un alimento sea auténtico?',
      a: ['Que tenga un envase atractivo', 'Que corresponda a lo declarado en su etiqueta'], correct: 1,
      msg: 'La autenticidad implica que el alimento sea lo que declara ser.' },
    { q: 'Antes de ingresar al área de producción, ¿qué debes hacer?',
      a: ['Lavarte las manos según el procedimiento', 'Lavarte las manos solo si se ven sucias'], correct: 0,
      msg: 'El lavado de manos es parte de las medidas de higiene para ingresar a producción.' },
    { q: 'Si detectas algo que puede afectar la inocuidad, ¿qué haces?',
      a: ['Esperar a que alguien más lo note', 'Comunicarlo de inmediato al responsable'], correct: 1,
      msg: 'Reportar a tiempo ayuda a prevenir problemas.' }
  ];

  // Certificaciones: VALIDAR vigencia y alcance antes del evento.
  // Si existe assets/certificaciones/<id>.png se muestra el logo; si no, el nombre.
  var CERTS = [
    { id: 'brcgs', name: 'BRCGS' },
    { id: 'bpm', name: 'BPM' },
    { id: 'kosher', name: 'Kosher' },
    { id: 'halal', name: 'Halal' },
    { id: 'organico-ecuador', name: 'Orgánico Ecuador' },
    { id: 'usda-organic', name: 'USDA Organic' }
  ];
  var CERT_ALCANCE = 'Alcance según planta y producto.';

  // "Conoce ILE": secuencia institucional del brief.
  // photos: fotos que se alternan a pantalla completa (si no cargan, queda el respaldo "fallback").
  var INST = 'assets/institucional/';
  var SLIDES = [
    { kicker: 'Bienvenidos', title: 'ILE: la calidad detrás del sabor.',
      fallback: 'presentacion' },
    { kicker: 'Nuestro compromiso CLAS', title: 'Calidad · Legalidad · Autenticidad · Seguridad',
      fallback: 'clas' },
    { kicker: 'Desde el origen', title: 'La calidad comienza con la selección de nuestras materias primas.',
      photos: [INST + 'origen-1.jpg', INST + 'origen-2.jpg', INST + 'origen-3.jpg', INST + 'origen-4.jpg'],
      fallback: 'icon', icon: 'i-leaf' },
    { kicker: 'Nuestros procesos', title: 'Cuidamos cada etapa para ofrecer alimentos seguros y de calidad.',
      photos: [INST + 'procesos-2.jpg', INST + 'procesos-3.jpg', INST + 'procesos-4-empaque.jpg'],
      fallback: 'icon', icon: 'i-shield', alt: true },
    { kicker: 'Cultura de inocuidad', title: 'La inocuidad se vive en nuestras decisiones de cada día.',
      photos: [INST + 'cultura-1.jpg', INST + 'cultura-2.jpg', INST + 'cultura-3.jpg'],
      fallback: 'icon', icon: 'i-people' },
    { kicker: 'Certificaciones', title: 'Certificaciones que respaldan nuestro compromiso.',
      fallback: 'certs', note: CERT_ALCANCE },
    { kicker: 'Productos y degustación', title: 'Descubre nuestros sabores.',
      fallback: 'tasting', cta: true }
  ];

  var LOGO_SRC = 'assets/logo-ile.png';
  var QR_SRC = 'assets/institucional/qr.png';

  /* =============================== UTILIDADES =============================== */

  function $(id) { return document.getElementById(id); }
  function each(list, fn) { for (var i = 0; i < list.length; i++) fn(list[i], i); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function icon(id) { return '<svg><use xlink:href="#' + id + '"/></svg>'; }
  function productSrc(id) { return 'assets/productos/' + id + '.webp'; }
  function fmtTime(s) { var m = Math.floor(s / 60); s = s % 60; return m + ':' + (s < 10 ? '0' : '') + s; }

  // Carga una imagen opcional: onOk(img) solo si el archivo existe.
  function tryImage(src, onOk) {
    var img = new Image();
    img.onload = function () { onOk(img); };
    img.src = src;
  }

  // Temporizadores ligados a la pantalla actual: se cancelan al cambiar de pantalla.
  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function every(fn, ms) { var t = setInterval(fn, ms); timers.push(-t); return t; }
  function clearTimers() {
    each(timers, function (t) { if (t < 0) clearInterval(-t); else clearTimeout(t); });
    timers = [];
  }

  // Cuenta regresiva visible ("Volviendo al inicio en N s")
  function countdown(node, ms, done) {
    var left = Math.round(ms / 1000);
    function paint() { node.innerHTML = 'Volviendo al inicio en ' + left + ' s'; }
    paint();
    var t = every(function () {
      left--;
      if (left <= 0) { clearInterval(t); done(); } else paint();
    }, 1000);
  }

  /* ================================ SONIDO ================================= */

  var Snd = (function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx = null;
    function tone(freq, dur, delay, type, vol) {
      if (!AC) return;
      try {
        if (!ctx) ctx = new AC();
        if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
        var t0 = ctx.currentTime + (delay || 0);
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + dur + 0.05);
      } catch (e) { /* sin sonido */ }
    }
    return {
      tap: function () { tone(660, 0.08, 0, 'sine', 0.15); },
      flip: function () { tone(520, 0.07, 0, 'triangle', 0.18); },
      good: function () { tone(660, 0.14); tone(880, 0.22, 0.12); },
      bad: function () { tone(300, 0.18, 0, 'triangle'); tone(220, 0.28, 0.14, 'triangle'); },
      win: function () { each([523, 659, 784, 1047], function (f, i) { tone(f, 0.25, i * 0.13); }); }
    };
  })();

  /* ========================= ESCALADO (RESPONSIVE) ========================= */
  // Escenario de 1080 px de ancho. En pantallas verticales más altas que 9:16
  // (celulares) el escenario crece en alto; en horizontales se centra.
  var stage = $('stage');
  function fit() {
    var W = window.innerWidth, H = window.innerHeight;
    var s = Math.min(W / 1080, H / 1920);
    var h = Math.max(1920, H / s);
    stage.style.height = h + 'px';
    stage.style.left = Math.round((W - 1080 * s) / 2) + 'px';
    stage.style.top = Math.round((H - h * s) / 2) + 'px';
    stage.style.webkitTransform = 'scale(' + s + ')';
    stage.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 300); });
  fit();

  /* ========================= NAVEGACIÓN E INACTIVIDAD ========================= */

  var current = 'home';
  var screens = { home: $('s-home'), tour: $('s-tour'), trivia: $('s-trivia'), memory: $('s-memory') };
  var onEnter = {};

  function go(name) {
    clearTimers();
    each(Object.keys(screens), function (k) { screens[k].className = 'screen' + (k === name ? ' active' : ''); });
    current = name;
    if (onEnter[name]) onEnter[name]();
    resetIdle();
  }

  var idleTimer = null;
  function resetIdle() {
    clearTimeout(idleTimer);
    if (current !== 'home') idleTimer = setTimeout(function () { go('home'); }, CONFIG.idleMs);
  }
  each(['touchstart', 'mousedown', 'keydown'], function (ev) {
    document.addEventListener(ev, resetIdle, true);
  });

  // Botones con data-go="pantalla"
  each(document.querySelectorAll('[data-go]'), function (b) {
    b.addEventListener('click', function () { Snd.tap(); go(b.getAttribute('data-go')); });
  });

  // Evitar menú contextual / zoom accidental en el tótem
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  // Gesto oculto: 5 toques en el logo del inicio -> pantalla completa
  (function () {
    var taps = 0, t = null;
    $('home-logo').addEventListener('click', function () {
      taps++; clearTimeout(t); t = setTimeout(function () { taps = 0; }, 2500);
      if (taps < 5) return;
      taps = 0;
      var d = document.documentElement;
      var req = d.requestFullscreen || d.webkitRequestFullscreen;
      if (req) req.call(d);
    });
  })();

  // Logo real si existe assets/logo-ile.png
  tryImage(LOGO_SRC, function () {
    each(document.querySelectorAll('.logo'), function (n) {
      n.className += ' has-img';
      n.innerHTML = '<img src="' + LOGO_SRC + '" alt="ILE">';
    });
  });

  // Precarga de productos
  each(PRODUCTS, function (p) { new Image().src = productSrc(p.id); });

  /* ================================ INICIO ================================= */

  (function () {
    var box = $('home-products');
    var pick = ['aji-criollo', 'meruvilla-pina-uvilla', 'sabora-condimento', 'salsa-bbq', 'sabrocitos-platanito'];
    var rot = [-8, 5, -3, 7, -6];
    each(pick, function (id, i) {
      var img = el('img');
      img.src = productSrc(id);
      img.alt = '';
      img.style.setProperty('--r', rot[i] + 'deg');
      img.style.webkitAnimationDelay = img.style.animationDelay = (i * 0.4) + 's';
      box.appendChild(img);
    });
  })();

  /* ========================== JUEGO 1: CONOCE ILE ========================== */

  var Tour = (function () {
    var wrap = $('tour-slides'), dots = $('tour-dots'), bar = $('tour-progress');
    var nodes = [], dotNodes = [], idx = 0;

    function visual(s) {
      var v;
      if (s.fallback === 'presentacion') {
        v = el('div', 'slide-visual vis-presentacion');
        v.appendChild(el('div', 'logo logo-xl', '<span>ILE</span>'));
        var bod = el('img', 'bodegon'); bod.src = INST + 'presentacion-bodegon.webp'; bod.alt = 'Productos ILE';
        v.appendChild(bod);
      } else if (s.fallback === 'clas') {
        v = el('div', 'slide-visual vis-clas');
        var row = el('div', 'clas-row');
        each(['Calidad', 'Legalidad', 'Autenticidad', 'Seguridad'], function (n) {
          row.appendChild(el('div', 'clas-item',
            '<div class="clas-letter">' + n.charAt(0) + '</div><div class="clas-name">' + n + '</div>'));
        });
        v.appendChild(row);
      } else if (s.fallback === 'certs') {
        v = el('div', 'slide-visual vis-certs');
        each(CERTS, function (c) {
          var b = el('div', 'cert', c.name);
          tryImage('assets/certificaciones/' + c.id + '.png', function (img) {
            b.innerHTML = ''; b.className += ' has-img'; img.alt = c.name; b.appendChild(img);
          });
          v.appendChild(b);
        });
      } else if (s.fallback === 'tasting') {
        v = el('div', 'slide-visual vis-tasting');
        var r = el('div', 'tasting-row');
        each(['aji-criollo', 'sabora-pollo', 'meruvilla-pina-uvilla', 'sabrocitos-platanito'], function (id) {
          var i = el('img'); i.src = productSrc(id); i.alt = ''; r.appendChild(i);
        });
        v.appendChild(r);
        var qr = el('div', 'qr-box', 'QR<br>ILE');
        tryImage(QR_SRC, function (img) { qr.innerHTML = ''; img.alt = 'QR ILE'; qr.appendChild(img); });
        v.appendChild(qr);
        v.appendChild(el('p', 'qr-caption', 'ile.com.ec'));
      } else {
        v = el('div', 'slide-visual vis-icon' + (s.alt ? ' alt' : ''),
          '<div class="vi-circle">' + icon(s.icon) + '</div>');
      }
      v.photos = [];
      each(s.photos || [], function (src, k) {
        var img = el('img', 'slide-photo' + (k === 0 ? ' on' : ''));
        img.alt = '';
        img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
        img.src = src;
        v.appendChild(img);
        v.photos.push(img);
      });
      return v;
    }

    each(SLIDES, function (s) {
      var n = el('div', 'slide');
      var vis = visual(s);
      n.photos = vis.photos;
      n.appendChild(vis);
      var txt = el('div', 'slide-text',
        '<span class="slide-kicker">' + s.kicker + '</span><h2 class="slide-title">' + s.title + '</h2>' +
        (s.note ? '<p class="slide-note">' + s.note + '</p>' : ''));
      if (s.cta) {
        var b = el('button', 'btn-cta btn-cta-sm slide-cta', '¡Juega la trivia!');
        b.type = 'button';
        b.addEventListener('click', function () { Snd.tap(); go('trivia'); });
        txt.appendChild(b);
      }
      n.appendChild(txt);
      wrap.appendChild(n);
      nodes.push(n);
      var d = el('span');
      dots.appendChild(d);
      dotNodes.push(d);
    });

    var autoT = null, photoT = null;
    function show(i) {
      idx = (i + SLIDES.length) % SLIDES.length;
      each(nodes, function (n, k) { n.className = 'slide' + (k === idx ? ' active' : ''); });
      each(dotNodes, function (d, k) { d.className = k === idx ? 'on' : ''; });

      // Fotos: empieza por la primera y alterna cada tourPhotoMs
      var photos = nodes[idx].photos, p = 0;
      each(photos, function (img, k) { img.className = 'slide-photo' + (k === 0 ? ' on' : ''); });
      clearInterval(photoT);
      if (photos.length > 1) {
        photoT = every(function () {
          photos[p].className = 'slide-photo';
          p = (p + 1) % photos.length;
          photos[p].className = 'slide-photo on';
        }, CONFIG.tourPhotoMs);
      }
      var dur = Math.max(CONFIG.tourSlideMs, photos.length * CONFIG.tourPhotoMs);

      // reinicia barra de progreso
      bar.className = '';
      void bar.offsetWidth;
      bar.style.webkitAnimationDuration = bar.style.animationDuration = dur + 'ms';
      bar.className = 'run';
      clearTimeout(autoT);
      autoT = later(function () {
        if (idx === SLIDES.length - 1) go('home'); else show(idx + 1);
      }, dur);
    }

    $('tour-prev').addEventListener('click', function () { Snd.tap(); show(idx - 1); });
    $('tour-next').addEventListener('click', function () { Snd.tap(); show(idx + 1); });

    return { start: function () { show(0); } };
  })();
  onEnter.tour = Tour.start;

  /* ============================ JUEGO 2: TRIVIA ============================ */

  var Trivia = (function () {
    var steps = { intro: $('t-intro'), question: $('t-question'), thanks: $('t-thanks') };
    var opts = document.querySelectorAll('.q-opt');
    var optsBox = document.querySelector('.q-options');
    var fb = $('q-feedback'), fbTitle = $('fb-title'), fbMsg = $('fb-msg');
    var q = null, answered = false, asked = 0, hits = 0, autoT = null;
    var btnNext = $('t-next');

    function step(name) {
      for (var k in steps) steps[k].className = 't-step' + (k === name ? ' active' : '');
    }

    // "Bolsa" de preguntas guardada en localStorage para no repetir hasta agotar todas.
    function nextQuestion() {
      var bag = [];
      try { bag = JSON.parse(localStorage.getItem('ileTriviaBag') || '[]'); } catch (e) { bag = []; }
      if (!bag.length) bag = shuffle(QUESTIONS.map(function (_, i) { return i; }));
      var i = bag.shift();
      try { localStorage.setItem('ileTriviaBag', JSON.stringify(bag)); } catch (e) { /* sin almacenamiento */ }
      return QUESTIONS[i] || QUESTIONS[0];
    }

    function ask() {
      clearTimeout(autoT);
      q = nextQuestion();
      answered = false;
      $('q-text').innerHTML = q.q;
      optsBox.className = 'q-options';
      each(opts, function (o, i) {
        o.className = 'q-opt';
        o.querySelector('.q-label').innerHTML = q.a[i];
        o.querySelector('.q-mark').innerHTML = '';
      });
      fb.className = 'q-feedback';
      step('question');
    }

    function answer(i) {
      if (answered) return;
      answered = true;
      var ok = i === q.correct;
      asked++;
      if (ok) hits++;
      optsBox.className = 'q-options answered';
      each(opts, function (o, k) {
        if (k === q.correct) { o.className = 'q-opt correct'; o.querySelector('.q-mark').innerHTML = icon('i-check'); }
        else if (k === i) { o.className = 'q-opt wrong'; o.querySelector('.q-mark').innerHTML = icon('i-x'); }
      });
      fbTitle.className = 'fb-title ' + (ok ? 'ok' : 'ko');
      fbTitle.innerHTML = ok ? '¡Correcto!' : '¡Buen intento!';
      fbMsg.innerHTML = (ok ? '' : 'La respuesta correcta es la <b>' + 'AB'.charAt(q.correct) + '</b>. ') + q.msg;
      // Sin más preguntas nuevas en esta sesión, solo queda "Terminar"
      btnNext.style.display = asked >= QUESTIONS.length ? 'none' : '';
      fb.className = 'q-feedback show';
      if (ok) Snd.good(); else Snd.bad();
      autoT = later(thanks, CONFIG.triviaFeedbackMs);
    }

    function thanks() {
      clearTimers();
      step('thanks');
      $('t-score').innerHTML = asked > 1 ? 'Acertaste ' + hits + ' de ' + asked + ' preguntas' : '';
      Snd.win();
      countdown($('t-countdown'), CONFIG.thanksMs, function () { go('home'); });
    }

    each(opts, function (o) {
      o.addEventListener('click', function () { answer(parseInt(o.getAttribute('data-i'), 10)); });
    });
    $('t-start').addEventListener('click', function () { Snd.tap(); ask(); });
    btnNext.addEventListener('click', function () { Snd.tap(); ask(); });
    $('t-finish').addEventListener('click', function () { Snd.tap(); thanks(); });

    return { start: function () { asked = hits = 0; step('intro'); } };
  })();
  onEnter.trivia = Trivia.start;

  /* ============================ JUEGO 3: MEMORIA =========================== */

  var Memory = (function () {
    var grid = $('m-grid'), toast = $('m-toast'), win = $('m-win');
    var deckProducts = [];
    var first, second, lock, pairs, moves, seconds, started, toastT;

    function stats() {
      $('m-pairs').innerHTML = pairs + '/' + deckProducts.length;
      $('m-moves').innerHTML = moves;
      $('m-time').innerHTML = fmtTime(seconds);
    }

    function build() {
      grid.innerHTML = '';
      deckProducts = shuffle(PRODUCTS).slice(0, CONFIG.memoryPairs);
      var deck = shuffle(deckProducts.concat(deckProducts));
      var row = null;
      each(deck, function (p, i) {
        if (i % CONFIG.memoryCols === 0) { row = el('div', 'mem-row'); grid.appendChild(row); }
        var c = el('div', 'card');
        c.setAttribute('data-id', p.id);
        c.innerHTML =
          '<div class="card-inner">' +
            '<div class="card-face card-back"><span class="logo-card">ILE</span></div>' +
            '<div class="card-face card-front"><img src="' + productSrc(p.id) + '" alt=""></div>' +
          '</div>';
        c.addEventListener('click', function () { tap(c); });
        row.appendChild(c);
      });
      // Si existe el logo real, también va en el dorso de las cartas
      tryImage(LOGO_SRC, function () {
        each(grid.querySelectorAll('.logo-card'), function (s) {
          s.parentNode.innerHTML = '<img src="' + LOGO_SRC + '" alt="">';
        });
      });
    }

    function nameOf(id) {
      for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i].name;
      return '';
    }

    function showToast(text) {
      toast.innerHTML = text;
      toast.className = 'mem-toast show';
      clearTimeout(toastT);
      toastT = setTimeout(function () { toast.className = 'mem-toast'; }, 1400);
    }

    function tap(c) {
      if (lock || c === first || /flipped|matched/.test(c.className)) return;
      if (!started) {
        started = true;
        every(function () { seconds++; stats(); }, 1000);
      }
      Snd.flip();
      c.className = 'card flipped';
      if (!first) { first = c; return; }
      second = c;
      moves++;
      if (first.getAttribute('data-id') === second.getAttribute('data-id')) {
        first.className = second.className = 'card matched';
        pairs++;
        later(Snd.good, 250);
        showToast('¡Par! ' + nameOf(c.getAttribute('data-id')));
        first = second = null;
        stats();
        if (pairs === deckProducts.length) later(finish, 900);
      } else {
        lock = true;
        stats();
        later(function () {
          first.className = second.className = 'card';
          first = second = null;
          lock = false;
        }, CONFIG.memoryMismatchMs);
      }
    }

    function finish() {
      clearTimers();
      Snd.win();
      $('m-win-stats').innerHTML = 'Encontraste los ' + deckProducts.length + ' pares en ' +
        moves + ' intentos y ' + fmtTime(seconds) + ' min.';
      win.className = 'overlay show';
      countdown($('m-countdown'), CONFIG.memoryWinMs, function () { go('home'); });
    }

    function start() {
      first = second = null; lock = false;
      pairs = moves = seconds = 0; started = false;
      win.className = 'overlay';
      toast.className = 'mem-toast';
      build();
      stats();
    }

    $('m-again').addEventListener('click', function () { Snd.tap(); clearTimers(); start(); });

    return { start: start };
  })();
  onEnter.memory = Memory.start;

})();
