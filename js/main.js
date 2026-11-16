/* Fills the page from js/content.js and wires up the interactions. */
(function () {
  const C = window.PORTFOLIO || {};
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => (/^(https?:|mailto:|#|\/)/i.test(u || '') ? u : '#');
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  /* "*word*" -> highlighted word; each word gets its own wrapper */
  const words = (text, wrap) =>
    String(text ?? '').split(/\s+/).filter(Boolean).map((tok, i) => {
      const m = tok.match(/^\*(.+?)\*(.*)$/);
      return wrap(m ? `<em class="glow">${esc(m[1])}</em>${esc(m[2])}` : esc(tok), i);
    }).join(' ');

  /* an image if one is set in content.js, otherwise a quiet numbered placeholder */
  const shot = (src, alt, n) =>
    `<div class="shot">${src
      ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${String(n + 1).padStart(2, '0')}'}))">`
      : `<span>${String(n + 1).padStart(2, '0')}</span>`}</div>`;

  /* ── content ── */
  const name = C.name || 'Your Name';
  document.title = `${name} — Portfolio`;
  $('mark').textContent = name.trim().charAt(0).toUpperCase();
  $('status').textContent = C.status || 'Online';
  $('tagline').textContent = C.tagline || '';

  const faces = C.faces || {};
  $('faces').innerHTML = [
    faces.anon && `<figure class="face anon"><img src="${esc(faces.anon)}" alt="${esc(name)}'s pixel-art avatar"></figure>`,
    faces.real && `<figure class="face"><img src="${esc(faces.real)}" alt="Portrait of ${esc(name)}"></figure>`,
  ].filter(Boolean).join('');

  /* first-screen headline: a short sentence if one is set, otherwise just the name */
  const nameEl = $('name');
  const headline = C.headline || name;
  nameEl.setAttribute('aria-label', headline.replace(/\*/g, ''));
  if (!C.headline) nameEl.classList.add('sr'); /* no big text: keep the name for screen readers only */
  nameEl.innerHTML = words(headline, (html, n) => `<span class="ch" aria-hidden="true" style="--i:${n}">${html}</span>`);

  const about = C.about || {};
  const statement = $('statement');
  statement.innerHTML = words(about.statement, (html) => `<span class="w">${html}</span>`);
  $('facts').innerHTML = (about.facts || []).map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('');

  $('cards').innerHTML = (C.projects || [])
    .map((p, n) => `
      <a class="card" href="${esc(safeUrl(p.link))}"${/^https?:/i.test(p.link || '') ? ' target="_blank" rel="noopener"' : ''}>
        ${shot(p.image, p.title, n)}
        <div class="card-top"><span>CASE ${String(n + 1).padStart(2, '0')}</span><span>${esc(p.year)}</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.blurb)}</p>
        <div class="card-foot">
          <ul class="tags">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <span class="arrow" aria-hidden="true">→</span>
        </div>
      </a>`)
    .join('');

  const talks = C.talks || [];
  $('rail').innerHTML = talks
    .map((t, n) => `
      <a class="talk reveal" href="${esc(safeUrl(t.link))}" style="--d:${Math.min(n, 4) * 0.06}s"${/^https?:/i.test(t.link || '') ? ' target="_blank" rel="noopener"' : ''}>
        ${shot(t.image, t.title, n)}
        <h3>${esc(t.title)}</h3>
        <p>${esc([t.event, t.year].filter(Boolean).join(' · '))}</p>
      </a>`)
    .join('');
  if (!talks.length) {
    $('talks').hidden = true;
    document.querySelector('.nav nav a[href="#talks"]').hidden = true;
  }

  const contact = C.contact || {};
  $('headline').innerHTML = words(contact.headline || "Let's talk.", (html, n) => `<span class="hw"><span style="--i:${n}">${html}</span></span>`);
  const email = $('email');
  email.href = contact.email ? `mailto:${contact.email}` : '#';
  email.querySelector('span').textContent = contact.email || 'Say hello';
  $('socials').innerHTML = (contact.socials || [])
    .map((s) => `<li><a href="${esc(safeUrl(s.url))}"${/^https?:/i.test(s.url || '') ? ' target="_blank" rel="noopener"' : ''}>${esc(s.label)} ↗</a></li>`)
    .join('');
  $('copyright').textContent = `© ${new Date().getFullYear()} ${name}`;

  /* ── arrival sequence ── */
  function arrive() {
    document.body.classList.add('ready');
    window.Scene && window.Scene.start();
    setTimeout(startRoles, 1300);
  }
  if (reduced) {
    arrive();
  } else {
    const count = $('loaderCount'), bar = $('loaderBar');
    const began = performance.now(), dur = 1500;
    (function tick(now) {
      const p = Math.min(1, (now - began) / dur);
      const e = 1 - Math.pow(1 - p, 2.2);
      count.textContent = String(Math.round(e * 100)).padStart(3, '0');
      bar.style.width = e * 100 + '%';
      p < 1 ? requestAnimationFrame(tick) : arrive();
    })(began);
  }

  /* ── role line: decode effect ── */
  const GLYPHS = '01<>/#{}[]=+*_$&';
  const roleEl = $('role');
  const roles = (C.roles && C.roles.length ? C.roles : ['builder']).map(String);
  let roleIdx = 0;
  function decode(text, done) {
    if (reduced) { roleEl.textContent = text; return done && done(); }
    let frame = 0;
    const total = text.length * 3 + 8;
    (function step() {
      const solid = Math.floor((frame / total) * text.length);
      let out = text.slice(0, solid);
      for (let k = solid; k < text.length; k++) out += text[k] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      roleEl.textContent = out;
      if (frame++ < total) setTimeout(step, 28);
      else { roleEl.textContent = text; done && done(); }
    })();
  }
  function startRoles() {
    decode(roles[roleIdx], () => {
      if (roles.length < 2) return;
      setTimeout(() => { roleIdx = (roleIdx + 1) % roles.length; startRoles(); }, 2600);
    });
  }

  /* ── reveals: start just before an element enters, so nothing is ever
        still fading in while you are trying to read it ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px 12% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ── scroll-linked motion ── */
  const heroInner = $('heroInner');
  const progress = $('progress');
  const scrollOut = $('sunrise');
  const links = [...document.querySelectorAll('.nav nav a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href')));
  const wordEls = [...statement.querySelectorAll('.w')];
  const cardEls = [...document.querySelectorAll('.card')];
  const absTop = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };

  let tops = {};
  function measure() {
    tops = { statement: absTop(statement), statementH: statement.offsetHeight, cards: cardEls.map(absTop) };
  }
  addEventListener('resize', measure);
  addEventListener('load', measure);
  document.fonts && document.fonts.ready.then(measure);
  measure();

  let sy = scrollY;
  function onFrame() {
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    sy += (scrollY - sy) * (reduced ? 1 : 0.14);
    if (Math.abs(scrollY - sy) < 0.05) sy = scrollY;
    const p = max > 0 ? clamp01(sy / max) : 0;

    progress.style.transform = `scaleX(${p})`;
    scrollOut.textContent = p.toFixed(2);

    /* hero drifts back and fades as you leave it */
    const h = clamp01(sy / (vh * 0.8));
    if (!reduced) {
      heroInner.style.transform = `translate3d(0, ${h * 90}px, 0) scale(${1 - h * 0.1})`;
      heroInner.style.opacity = String(1 - h * 1.15);
    }

    /* statement lights up word by word as it crosses the screen */
    const sp = clamp01((sy + vh * 0.9 - tops.statement) / (vh * 0.3 + tops.statementH * 0.25));
    const litCount = reduced ? wordEls.length : Math.ceil(sp * wordEls.length * 1.15);
    wordEls.forEach((w, n) => w.classList.toggle('lit', n < litCount));

    /* cards swing up from the ground, one after another */
    cardEls.forEach((card, n) => {
      const cp = reduced ? 1 : clamp01((sy + vh - tops.cards[n] - (n % 3) * 50) / (vh * 0.42));
      const e = 1 - Math.pow(1 - cp, 3);
      card.style.setProperty('--ty', (1 - e) * 90 + 'px');
      card.style.setProperty('--sc', String(0.9 + 0.1 * e));
      card.style.setProperty('--lean', (1 - e) * 22 + 'deg');
      card.style.setProperty('--op', String(0.3 + 0.7 * e));
    });

    let active = -1;
    sections.forEach((s, n) => { if (s && s.getBoundingClientRect().top < vh * 0.5) active = n; });
    links.forEach((a, n) => a.classList.toggle('active', n === active));

    requestAnimationFrame(onFrame);
  }
  requestAnimationFrame(onFrame);

  /* ── clock, written like a line of code: New York time + Unix epoch ── */
  const clock = $('clock');
  function tickClock() {
    const now = new Date();
    const nyc = now.toLocaleTimeString('en-GB', { timeZone: 'America/New_York' });
    clock.innerHTML =
      `{ <span class="nyc"><span class="k">nyc</span>: "${nyc}", </span>` +
      `<span class="k">unix</span>: ${Math.floor(now.getTime() / 1000)} }`;
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ── card tilt + spotlight ── */
  if (!reduced) {
    cardEls.forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', x * 100 + '%');
        card.style.setProperty('--my', y * 100 + '%');
        card.style.setProperty('--ry', (x - 0.5) * 12 + 'deg');
        card.style.setProperty('--rx', (0.5 - y) * 10 + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ── cursor ── */
  const cursor = $('cursor');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('on');
      cursor.classList.toggle('hot', !!e.target.closest('a, button'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
    (function follow() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(follow);
    })();
  }
})();
