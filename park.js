/* Whack-a-Life — the themed machines (one illustrated machine per life area) */
(() => {
  "use strict";
  const { moleSVG, INK } = window.WAL_THEMES;
  const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const S2 = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  const S1 = `stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"`;
  let uidN = 0;
  const nid = (p) => `${p}${++uidN}`;
  const f1 = (n) => Math.round(n * 10) / 10;
  function rng(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function mix(hex, to, amt) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
    const ch = (sh) => Math.round(((a >> sh) & 255) * (1 - amt) + ((b >> sh) & 255) * amt);
    return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  }
  const dark = (h, a = 0.2) => mix(h, INK, a);
  const light = (h, a = 0.4) => mix(h, "#ffffff", a);
  const hl = (x, y, w, h, o = 0.4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="#fff" opacity="${o}"/>`;
  const bulb = (x, y, i, r = 4.5) => `<circle class="bulb b${i % 2}" cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#FFF3B0" stroke="${INK}" stroke-width="1.5"/>`;
  const arcBulbs = (cx, cy, rx, ry, a0, a1, n, r) => [...Array(n)].map((_, i) => { const a = a0 + ((a1 - a0) * i) / (n - 1); return bulb(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, i, r); }).join("");
  const txt = (x, y, s, size, fill = "#fff", sw = 4) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Lilita One', 'Arial Rounded MT Bold', sans-serif" font-size="${size}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke">${s}</text>`;
  const nestMole = (theme, mood, x, y, w) => moleSVG(theme, mood).replace('<svg viewBox="0 0 120 130"', `<svg x="${x}" y="${y}" width="${w}" height="${f1((w * 130) / 120)}" viewBox="0 0 120 130"`);
  const CLOUD = "M14 44C2 44 0 30 12 27C10 14 26 8 34 16C38 2 62 2 66 16C76 10 92 18 88 30C98 32 98 44 86 44Z";
  const cloud = (x, y, k = 1, fill = "#fff", sw = 2.5) => `<path transform="translate(${f1(x)} ${f1(y)}) scale(${f1(k)})" d="${CLOUD}" fill="${fill}" stroke="${INK}" stroke-width="${f1(sw / k)}" stroke-linejoin="round"/>`;
  const hammerArt = (x, y, rot, k = 1) =>
    `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><rect x="-7" y="0" width="14" height="92" rx="7" fill="#E3A76A" ${S2}/><rect x="-28" y="-28" width="56" height="34" rx="10" fill="#F0473E" ${S}/>${hl(-20, -22, 38, 5, 0.45)}</g>`;

  // ---------------------------------------------------------------------------
  // Machines. Each: pixel size, window (themed screen), sign (name), art(t)
  // optional: front(t) = art drawn above the screen; bob = gentle float
  // ---------------------------------------------------------------------------
  const TYPES = {};

  TYPES.laptop = {
    label: "Laptop", w: 456, h: 338,
    win: { x: 62, y: 80, w: 256, h: 132, r: "8px" },
    sign: { x: 66, y: 22, w: 248, h: 40 },
    art: (t) => {
      const keyRow = (y, x0, x1, n, h = 11) => { const kw = (x1 - x0 - (n - 1) * 4) / n; let s = ""; for (let i = 0; i < n; i++) s += `<rect x="${f1(x0 + i * (kw + 4))}" y="${y}" width="${f1(kw)}" height="${h}" rx="3" fill="#fff" ${S1}/>`; return s; };
      return `
      <g transform="rotate(-8 37 100)"><rect x="12" y="76" width="52" height="50" rx="3" fill="#FFE07A" ${S2}/><path d="M20 92h34M20 102h26M20 112h30" stroke="${INK}" stroke-width="2" opacity=".45"/></g>
      <g transform="rotate(7 33 152)"><rect x="8" y="130" width="48" height="46" rx="3" fill="#FFB3C7" ${S2}/><path d="M16 146h30M16 156h22" stroke="${INK}" stroke-width="2" opacity=".45"/></g>
      <rect x="40" y="16" width="300" height="214" rx="20" fill="${t.cab}" ${S}/>
      <path d="M40 68V36Q40 16 60 16H320Q340 16 340 36V68Z" fill="${t.primary}" ${S}/>
      ${hl(56, 22, 268, 5)}
      <rect x="54" y="72" width="272" height="148" rx="12" fill="${INK}"/>
      <rect x="72" y="228" width="236" height="10" rx="3" fill="${dark(t.cab, 0.3)}" ${S2}/>
      <path d="M34 236H346L374 322H6Z" fill="${light(t.primary, 0.6)}" ${S}/>
      ${keyRow(246, 58, 322, 12)}${keyRow(262, 50, 330, 13)}
      <rect x="112" y="279" width="156" height="11" rx="3" fill="#fff" ${S1}/>
      <rect x="150" y="296" width="80" height="20" rx="5" fill="${light(t.primary, 0.3)}" ${S2}/>
      <g class="stick"><rect x="58" y="286" width="8" height="18" rx="3" fill="${INK}"/><circle cx="62" cy="288" r="10" fill="#F0473E" ${S2}/></g>
      <circle cx="318" cy="300" r="11" fill="#F0473E" ${S2}/>${hl(312, 293, 9, 3, 0.6)}
      <rect x="4" y="320" width="372" height="12" rx="6" fill="${INK}"/>
      <g class="steam"><path d="M398 244q-7-10 0-19t0-19" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".4"/><path d="M414 240q-7-10 0-19t0-19" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".4"/></g>
      <path d="M426 276q20 0 20 17t-20 17" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
      <path d="M426 276q20 0 20 17t-20 17" fill="none" stroke="${t.secondary}" stroke-width="4" stroke-linecap="round"/>
      <rect x="384" y="258" width="44" height="68" rx="9" fill="${t.secondary}" ${S}/>
      <ellipse cx="406" cy="261" rx="19" ry="5" fill="#7A4A2A" stroke="${INK}" stroke-width="2"/>
      ${hl(390, 272, 6, 40, 0.45)}
      <rect x="378" y="324" width="58" height="8" rx="4" fill="${INK}"/>`;
    },
  };

  TYPES.books = {
    label: "Book stack", w: 340, h: 432,
    win: { x: 80, y: 120, w: 164, h: 122, r: "6px" },
    sign: { x: 72, y: 260, w: 180, h: 34 },
    art: (t) => `
      <g transform="translate(314 404)"><circle r="20" fill="#F0473E" ${S2}/>${hl(-12, -11, 8, 5, 0.5)}<path d="M0 -20q2-10 9-13" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M4 -25q10-9 18 0q-9 7-18 0z" fill="#5FAE4F" ${S2}/></g>
      <rect x="12" y="356" width="292" height="66" rx="10" fill="${t.primary}" ${S}/>
      <rect x="13.5" y="366" width="289" height="7" fill="#FFC93C"/><rect x="13.5" y="404" width="289" height="7" fill="#FFC93C"/>
      ${txt(158, 397, "FINANCE", 20, "#fff", 4)}
      <g transform="rotate(-2.5 160 326)"><rect x="34" y="298" width="252" height="60" rx="10" fill="${t.secondary}" ${S}/><rect x="35.5" y="306" width="249" height="6" fill="#fff" opacity=".7"/><rect x="35.5" y="342" width="249" height="6" fill="#fff" opacity=".7"/>${txt(160, 335, "STRATEGY", 18, "#fff", 4)}</g>
      <path d="M266 104H278Q284 104 284 110V286Q284 292 278 292H266Z" fill="#FFF6E2" ${S2}/>
      <path d="M270 122H280M270 152H280M270 182H280M270 212H280M270 242H280M270 272H280" stroke="${INK}" stroke-width="1.4" opacity=".3"/>
      <rect x="54" y="96" width="216" height="198" rx="12" fill="${t.cab}" ${S}/>
      <path d="M67 99V291" stroke="${dark(t.cab, 0.25)}" stroke-width="10"/>
      <rect x="72" y="112" width="180" height="138" rx="10" fill="${INK}"/>
      <path d="M30 258H294L280 277L294 296H30L44 277Z" fill="#E5484D" ${S}/>
      <path d="M108 102Q160 82 212 102V80Q160 60 108 80Z" fill="#2E2A45" ${S}/>
      <path d="M160 14L294 56L160 98L26 56Z" fill="#3D3760" ${S}/>
      <path d="M162 23L270 57" stroke="#fff" stroke-width="4" opacity=".18" stroke-linecap="round"/>
      <g class="tassel"><path d="M160 56L272 76V124" fill="none" stroke="#FFC93C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M264 120h16l5 28h-26z" fill="#FFC93C" ${S2}/></g>
      <circle cx="160" cy="56" r="7" fill="#FFC93C" ${S2}/>`,
  };

  TYPES.house = {
    label: "House", w: 360, h: 424,
    win: { x: 66, y: 186, w: 228, h: 112, r: "6px" },
    sign: { x: 116, y: 118, w: 128, h: 32 },
    art: (t) => {
      const k = 166 / 136;
      let shingles = "";
      for (const y of [76, 102, 128, 154]) { const dx = (176 - y) * k; shingles += `<path d="M${f1(14 + dx)} ${y}H${f1(346 - dx)}" stroke="${INK}" stroke-width="2" opacity=".18"/>`; }
      const flowers = [70, 92, 116, 140, 222, 246, 270, 292].map((x, i) => `<circle cx="${x}" cy="306" r="7" fill="${["#FF6F91", "#FFC93C", "#fff", "#9B7BFF"][i % 4]}" ${S2}/>`).join("");
      const bush = (x, flip) => `<path transform="translate(${x} 0) scale(${flip ? -1 : 1} 1)" d="M0 414q-4-32 24-32q8-22 32-10q26-4 24 22q14 6 8 20z" fill="#5FAE4F" ${S}/>`;
      return `
      <g class="smoke"><circle cx="262" cy="40" r="11" fill="#fff" ${S2}/><circle cx="276" cy="22" r="8" fill="#fff" ${S2}/><circle cx="288" cy="8" r="5" fill="#fff" ${S2}/></g>
      <rect x="244" y="58" width="36" height="80" fill="#E5484D" ${S}/><path d="M244 80h36M244 102h36M262 58v22M252 80v22M270 102v22" stroke="${INK}" stroke-width="1.6" opacity=".3"/><rect x="238" y="52" width="48" height="12" rx="3" fill="${INK}"/>
      <rect x="34" y="166" width="292" height="238" fill="${t.primary}" ${S}/>
      ${[192, 214, 236, 258, 280, 302, 324, 346, 368, 390].map((y) => `<path d="M36 ${y}H324" stroke="${INK}" stroke-width="1.5" opacity=".12"/>`).join("")}
      <path d="M14 176L180 40L346 176Z" fill="${t.cab}" ${S}/>
      ${shingles}
      <rect x="108" y="112" width="144" height="44" rx="10" fill="#fff" ${S}/>
      <rect x="54" y="176" width="252" height="132" rx="10" fill="#fff" ${S}/>
      <rect x="48" y="306" width="264" height="14" rx="4" fill="#9A5B2E" ${S2}/>
      ${flowers}
      <rect x="62" y="334" width="62" height="44" rx="6" fill="#FFF3C4" ${S}/><path d="M93 334v44M62 356h62" stroke="${INK}" stroke-width="2"/>
      <rect x="236" y="334" width="62" height="44" rx="6" fill="#FFF3C4" ${S}/><path d="M267 334v44M236 356h62" stroke="${INK}" stroke-width="2"/>
      <rect x="152" y="330" width="56" height="74" rx="6" fill="${t.secondary}" ${S}/><rect x="164" y="342" width="32" height="18" rx="9" fill="#FFF3C4" ${S2}/><circle cx="198" cy="372" r="4" fill="${INK}"/>
      <rect x="140" y="402" width="80" height="10" rx="3" fill="#C98A4B" ${S2}/>
      ${bush(2, false)}${bush(358, true)}
      <rect x="4" y="410" width="352" height="12" rx="6" fill="${INK}"/>`;
    },
  };

  TYPES.piggy = {
    label: "Piggy bank", w: 400, h: 334,
    win: { x: 118, y: 124, w: 184, h: 104, r: "24px" },
    sign: { x: 144, y: 240, w: 132, h: 32 },
    art: (t) => {
      const P = "#FF9EB5", PD = "#F27C9C", PL = "#FFC7D5";
      const coin = (cls) => `<g class="coin ${cls}"><circle cx="206" cy="40" r="14" fill="#FFC93C" ${S2}/><path d="M206 33v14" stroke="#B57F00" stroke-width="3" stroke-linecap="round"/></g>`;
      const pile = [[346, 324], [374, 324], [360, 316], [360, 308], [388, 316]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="5" fill="#FFC93C" ${S2}/>`).join("");
      return `
      ${coin("c1")}${coin("c2")}
      <path d="M356 172q28-6 24-30q-4-16-18-8q-10 8 2 16" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
      <path d="M356 172q28-6 24-30q-4-16-18-8q-10 8 2 16" fill="none" stroke="${P}" stroke-width="5" stroke-linecap="round"/>
      <rect x="96" y="250" width="42" height="74" rx="13" fill="${PD}" ${S}/>
      <rect x="262" y="250" width="42" height="74" rx="13" fill="${PD}" ${S}/>
      <rect x="140" y="250" width="44" height="74" rx="13" fill="${P}" ${S}/>
      <rect x="226" y="250" width="44" height="74" rx="13" fill="${P}" ${S}/>
      <path d="M97 310h40M263 310h40M141 310h42M227 310h42" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="200" cy="186" rx="162" ry="116" fill="${P}" ${S}/>
      <path d="M96 272Q200 316 304 272" fill="none" stroke="${PD}" stroke-width="6" stroke-linecap="round" opacity=".7"/>
      ${hl(122, 92, 72, 10, 0.5)}
      <path d="M112 92L96 36L158 78Z" fill="${P}" ${S}/><path d="M116 82L106 52L142 76Z" fill="${PD}"/>
      <ellipse cx="44" cy="196" rx="30" ry="38" fill="${PL}" ${S}/>
      <ellipse cx="36" cy="184" rx="5" ry="8" fill="${INK}"/><ellipse cx="36" cy="210" rx="5" ry="8" fill="${INK}"/>
      <circle cx="96" cy="152" r="9" fill="${INK}"/><circle cx="99" cy="149" r="3" fill="#fff"/>
      <ellipse cx="90" cy="186" rx="12" ry="7" fill="#FF6F91" opacity=".55"/>
      <rect x="176" y="66" width="60" height="12" rx="6" fill="${INK}"/>
      <rect x="110" y="116" width="200" height="120" rx="30" fill="${INK}"/>
      <rect x="138" y="236" width="144" height="40" rx="12" fill="${t.primary}" ${S}/>
      ${pile}`;
    },
  };

  TYPES.airplane = {
    label: "Airplane", w: 690, h: 342, bob: true,
    win: { x: 98, y: 106, w: 244, h: 84, r: "42px" },
    sign: { x: 526, y: 64, w: 142, h: 40 },
    art: (t) => `
      <path d="M454 86L522 72M454 86L522 110" stroke="${INK}" stroke-width="2.2"/>
      <path d="M520 58Q560 48 600 58T680 58V112Q640 122 600 112T520 112Z" fill="#fff" ${S}/>
      <path d="M374 96L404 14H448L456 84Z" fill="${t.primary}" ${S}/>
      <circle cx="426" cy="50" r="14" fill="#fff" ${S2}/>
      <path d="M426 59C412 50 416 40 422 40C425 40 426 42 426 44C426 42 427 40 430 40C436 40 440 50 426 59Z" fill="${t.primary}"/>
      <path d="M70 90H360Q404 90 456 74Q462 120 432 168Q408 212 356 214H70Q20 214 20 152Q20 90 70 90Z" fill="#fff"/>
      <path d="M22 170H436Q424 194 404 204Q384 214 356 214H70Q32 214 22 170Z" fill="${t.primary}"/>
      <path d="M24 160H440" stroke="${t.secondary}" stroke-width="6"/>
      <path d="M70 90H360Q404 90 456 74Q462 120 432 168Q408 212 356 214H70Q20 214 20 152Q20 90 70 90Z" fill="none" ${S}/>
      <path d="M34 128Q42 104 70 102H84V136H40Q32 136 34 128Z" fill="${INK}"/>${hl(46, 108, 24, 5, 0.5)}
      <rect x="90" y="98" width="260" height="100" rx="50" fill="${INK}"/>
      <path d="M394 148L466 132L474 152L402 168Z" fill="${t.secondary}" ${S}/>
      <path d="M190 200H306L262 278H224Z" fill="${t.secondary}" ${S}/>
      <rect x="194" y="236" width="84" height="34" rx="17" fill="#fff" ${S}/>
      <ellipse cx="200" cy="253" rx="9" ry="17" fill="${INK}"/>
      <path d="M226 244h40" stroke="${t.primary}" stroke-width="4" stroke-linecap="round"/>`,
    front: () => `
      ${cloud(-6, 258, 1.7)}${cloud(150, 270, 2.0)}${cloud(330, 262, 1.8)}${cloud(480, 276, 1.6)}
      ${cloud(80, 288, 1.4)}${cloud(260, 292, 1.5)}${cloud(420, 296, 1.3)}`,
  };

  TYPES.striker = {
    label: "Strength tester", w: 280, h: 482,
    win: { x: 52, y: 192, w: 166, h: 112, r: "10px" },
    sign: { x: 58, y: 136, w: 154, h: 40 },
    art: (t) => {
      let bands = "";
      for (let i = 0; i < 15; i++) bands += `<rect x="120" y="${96 + i * 21}" width="30" height="12" rx="3" fill="hsl(${10 + i * 8} 80% 58%)"/>`;
      return `
      <circle class="pulse-ring" cx="135" cy="54" r="50" fill="none" stroke="${t.secondary}" stroke-width="5"/>
      <rect x="116" y="84" width="38" height="324" fill="#fff" ${S}/>
      ${bands}
      <g class="beat"><path d="M135 92C82 62 88 16 116 16C127 16 135 24 135 32C135 24 143 16 154 16C182 16 188 62 135 92Z" fill="${t.secondary}" ${S}/>${hl(108, 26, 14, 7, 0.55)}</g>
      <g class="puck"><rect x="120" y="372" width="30" height="16" rx="5" fill="${t.primary}" ${S2}/></g>
      <path d="M40 188Q40 126 135 126Q230 126 230 188Z" fill="${t.primary}" ${S}/>
      ${arcBulbs(135, 188, 86, 54, Math.PI * 1.08, Math.PI * 1.92, 9, 4.5)}
      <rect x="44" y="184" width="182" height="128" rx="16" fill="${INK}"/>
      <path d="M26 468L54 408H216L244 468Z" fill="${t.cab}" ${S}/>
      <ellipse cx="135" cy="434" rx="42" ry="12" fill="#F0473E" ${S2}/>${hl(112, 427, 22, 4, 0.5)}
      ${hammerArt(250, 372, 14, 1.1)}
      <rect x="16" y="466" width="248" height="14" rx="7" fill="${INK}"/>`;
    },
  };

  const horse = (t) => `
    <path d="M30 2q18 6 14 28" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <path d="M30 2q18 6 14 28" fill="none" stroke="${t.primary}" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="14" y="4" width="8" height="30" rx="4" fill="#EDE8FF" ${S2}/>
    <rect x="24" y="4" width="8" height="28" rx="4" fill="#fff" ${S2}/>
    <rect x="-16" y="2" width="8" height="20" rx="4" transform="rotate(40 -12 4)" fill="#EDE8FF" ${S2}/>
    <rect x="-8" y="4" width="8" height="28" rx="4" fill="#fff" ${S2}/>
    <ellipse cx="8" cy="0" rx="26" ry="14" fill="#fff" ${S2}/>
    <path d="M-12 -2L-22 -30L-6 -36L2 -8Z" fill="#fff" ${S2}/>
    <ellipse cx="-24" cy="-32" rx="16" ry="9" transform="rotate(-28 -24 -32)" fill="#fff" ${S2}/>
    <path d="M-15 -40l1 -10 7 8z" fill="#fff" ${S2}/>
    <path d="M-10 -38Q4 -30 2 -6Q-4 -14 -10 -18Z" fill="${t.primary}" ${S2}/>
    <path d="M-2 -12Q10 -18 24 -12L22 -2Q10 -6 -2 -2Z" fill="${t.secondary}" ${S2}/>
    <circle cx="-28" cy="-35" r="2.3" fill="${INK}"/>`;

  TYPES.carousel = {
    label: "Carousel", w: 400, h: 434,
    win: { x: 112, y: 196, w: 176, h: 126, r: "10px" },
    sign: { x: 72, y: 147, w: 256, h: 34 },
    art: (t) => {
      const wedges = [...Array(10)].map((_, i) => { const x1 = 16 + i * 36.8, x2 = x1 + 36.8; return `<path d="M200 28L${f1(x1)} 150H${f1(x2)}Z" fill="${i % 2 ? "#fff" : t.primary}"/>`; }).join("");
      const scallops = [...Array(13)].map((_, i) => `<path d="M${f1(10 + i * 29.2)} 182a14.6 13 0 0 0 29.2 0Z" fill="${i % 2 ? t.primary : "#fff"}" ${S2}/>`).join("");
      const skirtBulbs = [...Array(11)].map((_, i) => { const x = 28 + i * 34.4, u = (x - 10) / 380; return bulb(x, 386 + Math.sin(Math.PI * u) * 20, i, 4); }).join("");
      return `
      <path d="M200 30V4" stroke="${INK}" stroke-width="3"/><path d="M201 5l24 7-24 8z" fill="${t.secondary}" ${S2}/>
      ${wedges}<path d="M16 150L200 28L384 150Z" fill="none" ${S}/>
      <circle cx="200" cy="30" r="8" fill="${t.secondary}" ${S2}/>
      <rect x="61" y="176" width="7" height="200" fill="#FFC93C" ${S2}/><rect x="332" y="176" width="7" height="200" fill="#FFC93C" ${S2}/>
      ${scallops}
      <rect x="10" y="144" width="380" height="40" rx="6" fill="${t.secondary}" ${S}/>
      <rect x="102" y="186" width="196" height="146" rx="14" fill="${INK}"/>
      <g transform="translate(64 290)"><g class="horse h1">${horse(t)}</g></g>
      <g transform="translate(336 270) scale(-1 1)"><g class="horse h2">${horse(t)}</g></g>
      <ellipse cx="200" cy="372" rx="190" ry="26" fill="${t.cab}" ${S}/>
      <path d="M10 372Q200 412 390 372V396Q200 436 10 396Z" fill="${t.primary}" ${S}/>
      ${skirtBulbs}`;
    },
  };

  TYPES.capsule = {
    label: "Capsule machine", w: 300, h: 452,
    win: { x: 66, y: 316, w: 168, h: 84, r: "8px" },
    sign: { x: 72, y: 276, w: 156, h: 30 },
    art: (t) => {
      const id = nid("gl"), cols = ["#FF6F91", "#4EA8F5", "#2FCB7A", "#FFC93C", "#9B7BFF", "#FF8A3D"];
      const r = rng("caps");
      let caps = "";
      for (let j = 0; j < 5; j++) {
        const y = 250 - j * 25, hw = Math.sqrt(Math.max(0, 114 * 114 - (y - 150) ** 2));
        for (let x = 150 - hw + 18 + (j % 2) * 18; x < 150 + hw - 4; x += 36) {
          if (j === 4 && r() < 0.5) continue;
          const cx = x + (r() - 0.5) * 6, cy = y + (r() - 0.5) * 6, rr = 17, a = Math.round(r() * 360), c = cols[Math.floor(r() * cols.length)];
          caps += `<g transform="rotate(${a} ${f1(cx)} ${f1(cy)})"><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${rr}" fill="#fff" ${S2}/><path d="M${f1(cx - rr)} ${f1(cy)}A${rr} ${rr} 0 0 1 ${f1(cx + rr)} ${f1(cy)}Z" fill="${c}" ${S2}/></g>`;
        }
      }
      return `
      <defs><clipPath id="${id}"><circle cx="150" cy="150" r="115"/></clipPath></defs>
      <rect x="110" y="20" width="80" height="30" rx="10" fill="${t.primary}" ${S}/><circle cx="150" cy="18" r="9" fill="${t.secondary}" ${S2}/>
      <circle cx="150" cy="150" r="118" fill="#E6F4FF"/>
      <g clip-path="url(#${id})">${caps}</g>
      <path d="M66 96Q90 54 140 40" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".85"/>
      <circle cx="150" cy="150" r="118" fill="none" ${S}/>
      <rect x="94" y="262" width="112" height="16" rx="4" fill="${t.secondary}" ${S}/>
      <path d="M50 274H250L276 440H24Z" fill="${t.primary}" ${S}/>
      <rect x="64" y="274" width="172" height="34" rx="10" fill="#fff" ${S2}/>
      <rect x="58" y="310" width="184" height="96" rx="12" fill="${INK}"/>
      <g class="knob"><circle cx="112" cy="424" r="12" fill="#fff" ${S2}/><rect x="104" y="421" width="16" height="6" rx="3" fill="${INK}"/></g>
      <rect x="160" y="412" width="56" height="22" rx="5" fill="${INK}"/>
      <rect x="16" y="438" width="268" height="12" rx="6" fill="${INK}"/>`;
    },
  };

  TYPES.shepherd = {
    label: "German shepherd", w: 380, h: 452,
    win: { x: 124, y: 248, w: 132, h: 132, r: "50%" },
    sign: { x: 122, y: 191, w: 136, h: 28 },
    art: (t) => {
      const TAN = "#D9984F", LT = "#F2C38A", BLK = "#34303D", MZ = "#4A4452";
      return `
      <circle cx="36" cy="430" r="16" fill="#E5484D" ${S2}/><path d="M22 426q14 8 28 0" stroke="#fff" stroke-width="3" fill="none"/>
      <g class="tail"><path d="M276 392Q350 380 350 300Q350 276 334 282Q326 350 270 360Z" fill="${BLK}" ${S}/><path d="M346 296Q346 280 336 283Q334 292 333 302Z" fill="${TAN}"/></g>
      <path d="M128 222Q88 300 92 384Q96 432 140 436H240Q284 432 288 384Q292 300 252 222Z" fill="${BLK}" ${S}/>
      <path d="M150 232Q124 300 130 404H250Q256 300 230 232Z" fill="${TAN}"/>
      <ellipse cx="108" cy="398" rx="38" ry="36" fill="${TAN}" ${S}/>
      <ellipse cx="272" cy="398" rx="38" ry="36" fill="${TAN}" ${S}/>
      <ellipse cx="94" cy="434" rx="26" ry="10" fill="${LT}" ${S2}/>
      <ellipse cx="286" cy="434" rx="26" ry="10" fill="${LT}" ${S2}/>
      <rect x="146" y="330" width="36" height="102" rx="15" fill="${TAN}" ${S}/>
      <rect x="198" y="330" width="36" height="102" rx="15" fill="${TAN}" ${S}/>
      <ellipse cx="164" cy="434" rx="24" ry="10" fill="${LT}" ${S2}/><ellipse cx="216" cy="434" rx="24" ry="10" fill="${LT}" ${S2}/>
      <path d="M156 430v8M164 430v8M172 430v8M208 430v8M216 430v8M224 430v8" stroke="${INK}" stroke-width="1.6" opacity=".5"/>
      <g class="ear el"><path d="M112 132L86 16Q90 6 100 12L172 94Z" fill="${BLK}" ${S}/><path d="M118 116L100 36L156 94Z" fill="${LT}"/></g>
      <g class="ear er"><path d="M268 132L294 16Q290 6 280 12L208 94Z" fill="${BLK}" ${S}/><path d="M262 116L280 36L224 94Z" fill="${LT}"/></g>
      <path d="M190 56Q262 56 276 128Q286 192 238 216Q214 230 190 230Q166 230 142 216Q94 192 104 128Q118 56 190 56Z" fill="${TAN}" ${S}/>
      <path d="M190 58Q244 60 262 100Q236 96 216 124Q202 112 190 112Q178 112 164 124Q144 96 118 100Q136 60 190 58Z" fill="${BLK}"/>
      <ellipse cx="160" cy="106" rx="9" ry="6" fill="${TAN}"/><ellipse cx="220" cy="106" rx="9" ry="6" fill="${TAN}"/>
      <ellipse cx="190" cy="178" rx="48" ry="36" fill="${LT}"/>
      <path d="M156 160Q190 132 224 160Q216 186 190 188Q164 186 156 160Z" fill="${MZ}"/>
      <path d="M174 154Q190 144 206 154Q204 170 190 174Q176 170 174 154Z" fill="${INK}"/>${hl(181, 150, 11, 4, 0.55)}
      <circle cx="156" cy="132" r="10" fill="${INK}"/><circle cx="159" cy="128" r="3.4" fill="#fff"/>
      <circle cx="224" cy="132" r="10" fill="${INK}"/><circle cx="227" cy="128" r="3.4" fill="#fff"/>
      <ellipse cx="134" cy="172" rx="12" ry="7" fill="#FF8FAB" opacity=".55"/><ellipse cx="246" cy="172" rx="12" ry="7" fill="#FF8FAB" opacity=".55"/>
      <path d="M130 226Q190 250 250 226L254 242Q190 270 126 242Z" fill="${t.secondary}" ${S}/>
      <circle cx="190" cy="314" r="74" fill="#FFC93C" ${S}/>
      <circle cx="190" cy="248" r="9" fill="none" stroke="${INK}" stroke-width="8"/><circle cx="190" cy="248" r="9" fill="none" stroke="#FFC93C" stroke-width="4"/>
      <circle cx="112" cy="195" r="15" fill="#fff" ${S2}/><circle cx="112" cy="219" r="15" fill="#fff" ${S2}/>
      <circle cx="268" cy="195" r="15" fill="#fff" ${S2}/><circle cx="268" cy="219" r="15" fill="#fff" ${S2}/>
      <rect x="110" y="189" width="160" height="36" rx="14" fill="#fff" ${S2}/><rect x="104" y="197" width="172" height="20" fill="#fff"/>
      <ellipse cx="338" cy="440" rx="36" ry="10" fill="${t.primary}" ${S2}/>
      <path d="M306 438Q338 420 370 438" fill="#8B5A2B" ${S2}/>`;
    },
  };

  TYPES.whacktable = {
    label: "Whack-a-mole table", w: 420, h: 382,
    win: { x: 52, y: 102, w: 296, h: 104, r: "10px" },
    sign: { x: 84, y: 40, w: 232, h: 48 },
    art: (t, o = {}) => {
      const th = o.moleThemes || ["arcade", "arcade", "arcade"];
      const holes = [[120, 252, "normal", th[0], 1], [200, 248, "angry", th[1], 2], [280, 252, "sleepy", th[2], 3], [92, 292, "normal", th[1], 4], [200, 294, null], [308, 292, "angry", th[0], 5]];
      const hole = ([x, y, mood, theme, n]) => {
        const id = nid("tc");
        return `<ellipse cx="${x}" cy="${y}" rx="32" ry="11" fill="#2A2238" ${S2}/>` +
          (mood ? `<clipPath id="${id}"><rect x="${x - 40}" y="${y - 60}" width="80" height="60"/></clipPath><g clip-path="url(#${id})"><g class="tm tm${n}">${nestMole(theme, mood, x - 22, y - 50, 44)}</g></g>` : "") +
          `<path d="M${x - 32} ${y}A32 11 0 0 0 ${x + 32} ${y}" fill="none" ${S2}/>`;
      };
      return `
      <path d="M22 100Q22 12 200 12Q378 12 378 100Z" fill="${t.primary}" ${S}/>
      ${arcBulbs(200, 100, 166, 78, Math.PI * 1.05, Math.PI * 1.95, 13, 5)}
      <rect x="44" y="94" width="312" height="120" rx="14" fill="${INK}"/>
      <path d="M44 222H356L392 318H8Z" fill="${t.secondary}" ${S}/>
      ${hl(64, 228, 272, 6, 0.35)}
      ${holes.map(hole).join("")}
      <path d="M8 318H392V366H8Z" fill="${t.cab}" ${S}/>
      <rect x="40" y="330" width="34" height="24" rx="5" fill="${INK}" opacity=".85"/><rect x="54" y="334" width="6" height="16" rx="2" fill="#FFC93C"/>
      ${txt(224, 350, "INSERT COIN", 16, "#FFC93C", 3)}
      ${hammerArt(398, 300, 10, 0.95)}
      <rect x="2" y="364" width="396" height="14" rx="7" fill="${INK}"/>`;
    },
  };

  // generic machines for custom areas
  TYPES.upright = {
    label: "Classic cabinet", w: 220, h: 350,
    win: { x: 42, y: 101, w: 136, h: 110, r: "10px" },
    sign: { x: 24, y: 15, w: 172, h: 55 },
    art: (t) => `<g transform="scale(1.1)">
      <rect x="12" y="8" width="176" height="62" rx="14" fill="${t.primary}" ${S}/>${hl(22, 14, 156, 6)}
      <path d="M24 68H176V196L190 214V302H10V214L24 196Z" fill="${t.cab}" ${S}/>
      <path d="M32 76h8v116h-8z" fill="#fff" opacity=".18"/>
      <rect x="30" y="84" width="140" height="116" rx="16" fill="${INK}"/>
      <path d="M8 216L24 202H176L192 216V236H8Z" fill="${t.primary}" ${S}/>
      <g class="stick"><rect x="50" y="204" width="8" height="14" rx="3" fill="${INK}"/><circle cx="54" cy="206" r="9" fill="#F0473E" ${S2}/></g>
      <circle cx="112" cy="218" r="8" fill="${t.secondary}" ${S2}/><circle cx="136" cy="218" r="8" fill="#fff" ${S2}/><circle cx="160" cy="218" r="8" fill="${t.secondary}" ${S2}/>
      <rect x="68" y="250" width="64" height="40" rx="7" fill="${INK}" opacity=".85"/>
      <rect x="84" y="258" width="7" height="15" rx="2" fill="#FFC93C"/><rect x="109" y="258" width="7" height="15" rx="2" fill="#FFC93C"/>
      <rect x="4" y="300" width="192" height="16" rx="6" fill="${INK}"/></g>`,
  };

  TYPES.claw = {
    label: "Claw machine", w: 254, h: 358,
    win: { x: 22, y: 77, w: 210, h: 168, r: "6px" },
    sign: { x: 44, y: 24, w: 166, h: 42 },
    front: () => `<g transform="scale(1.1)"><rect x="20" y="70" width="190" height="7" fill="#C9CED8" stroke="${INK}" stroke-width="1.5"/>
      <g class="claw-arm"><line x1="84" y1="77" x2="84" y2="114" stroke="${INK}" stroke-width="2"/>
      <path d="M74 114h20l-3 7 9 14-6 3-9-12-6 12-6-3 9-14z" fill="#C9CED8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/></g>
      <path d="M140 70L170 70L80 222L50 222Z" fill="#fff" opacity=".14"/></g>`,
    art: (t) => `<g transform="scale(1.1)">
      <path d="M10 66Q10 10 115 10Q220 10 220 66Z" fill="${t.primary}" ${S}/>
      ${[...Array(9)].map((_, i) => { const a = Math.PI * (0.08 + (i * 0.84) / 8); return bulb(115 - Math.cos(a) * 92, 62 - Math.sin(a) * 46, i); }).join("")}
      <rect x="12" y="62" width="206" height="168" rx="8" fill="${INK}"/>
      <rect x="6" y="228" width="218" height="34" rx="6" fill="${t.secondary}" ${S}/>
      <rect x="40" y="226" width="7" height="18" rx="3" fill="${INK}" transform="rotate(-12 43 244)"/><circle cx="40" cy="226" r="9" fill="#F0473E" ${S2}/>
      <circle cx="190" cy="245" r="9" fill="#F0473E" ${S2}/>
      <rect x="14" y="260" width="202" height="52" fill="${t.cab}" ${S}/>
      <rect x="148" y="268" width="56" height="36" rx="7" fill="${INK}"/>
      <rect x="6" y="308" width="218" height="14" rx="6" fill="${INK}"/></g>`,
  };

  const THEME_TYPE = { work: "laptop", mba: "books", apartment: "house", money: "piggy", travel: "airplane", health: "striker", family: "carousel", possessions: "capsule", murphy: "shepherd", arcade: "upright", forest: "claw", ocean: "upright", sunset: "claw" };
  const PICKABLE = ["laptop", "books", "house", "piggy", "airplane", "striker", "carousel", "capsule", "shepherd", "upright", "claw"];
  const typeFor = (area) => (TYPES[area?.machine] && area.machine !== "whacktable" ? area.machine : THEME_TYPE[area?.theme] || "upright");

  window.WAL_PARK = { TYPES, PICKABLE, typeFor };
})();
