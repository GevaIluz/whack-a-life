/* Whack-a-Life — worlds, scenes & mole art (bright, flat, ink-outlined) */
(() => {
  "use strict";

  const INK = "#1F2544";

  // primary: marquee/accent · cab: cabinet body · far/near: scene layers · ground/rim: game board
  const THEMES = {
    work:        { name: "Downtown",     primary: "#4EA8F5", secondary: "#FFC93C", cab: "#2F74C0", sky: ["#BFE3FF", "#E9F5FF"], far: "#B3CDE8", near: "#86A9D2", ground: ["#9DB3D3", "#8AA2C6"], rim: "#6C86AE", hat: "tie",     scene: "skyline" },
    mba:         { name: "Campus",       primary: "#9B7BFF", secondary: "#FFC93C", cab: "#6B4FD6", sky: ["#E2DAFF", "#F5F2FF"], far: "#D3C8F5", near: "#A996E6", ground: ["#86CF73", "#74C062"], rim: "#55A045", hat: "grad",    scene: "campus" },
    apartment:   { name: "Home Base",    primary: "#FF9F43", secondary: "#4ECDC4", cab: "#DB7A22", sky: ["#FFE9CF", "#FFF5E8"], far: "#F6CFA3", near: "#D9A26E", ground: ["#DDA56B", "#CF9459"], rim: "#AE7440", hat: "hardhat", scene: "lamps" },
    money:       { name: "Gold Rush",    primary: "#2FCB7A", secondary: "#FFC93C", cab: "#1E9C5B", sky: ["#D3F5E1", "#F0FBF4"], far: "#ABE6C4", near: "#1E9C5B", ground: ["#63C990", "#52BA80"], rim: "#33995F", hat: "visor",   scene: "coins" },
    travel:      { name: "Jet Set",      primary: "#FF7A59", secondary: "#4EA8F5", cab: "#E2573A", sky: ["#86CFFF", "#D3EEFF"], far: "#9ED8F7", near: "#5BB5E8", ground: ["#F5D78F", "#ECC877"], rim: "#D2AA55", hat: "shades",  scene: "clouds" },
    health:      { name: "Pulse Clinic", primary: "#2EC4B6", secondary: "#FF5A6E", cab: "#1B9C90", sky: ["#D2F6F0", "#EFFCFA"], far: "#B2EBE1", near: "#5FC9BA", ground: ["#83D9CA", "#70CCBC"], rim: "#47AD9D", hat: "med",     scene: "pulse" },
    fitness:     { name: "Iron Gym",     primary: "#FF5E5B", secondary: "#FFC93C", cab: "#D63E3B", sky: ["#FFE2DC", "#FFF4F2"], far: "#F5B8B2", near: "#E07A74", ground: ["#9BA8B8", "#8796A8"], rim: "#68778A", hat: "band",    scene: "gym" },
    errands:     { name: "City Run",     primary: "#5C7CFA", secondary: "#FFC93C", cab: "#3B5BDB", sky: ["#DCE6FF", "#F2F6FF"], far: "#B8CCFF", near: "#748FFC", ground: ["#B2BCC8", "#9EA9B8"], rim: "#7A8696", hat: "cap",     scene: "errands" },
    family:      { name: "Backyard",     primary: "#FF6F91", secondary: "#FFC93C", cab: "#DE4A70", sky: ["#FFDDE5", "#FFF2F5"], far: "#FFC2CF", near: "#8D6E9C", ground: ["#9BD67F", "#88C86C"], rim: "#64A84B", hat: "bow",     scene: "hearts" },
    possessions: { name: "Warehouse",    primary: "#F4B740", secondary: "#FF7A59", cab: "#C98A1B", sky: ["#F4E8D4", "#FBF6EC"], far: "#E6D3B3", near: "#A88B62", ground: ["#C9C3B8", "#B9B2A6"], rim: "#968F83", hat: "box",     scene: "crates" },
    murphy:      { name: "Dog Park",     primary: "#F59E42", secondary: "#4EA8F5", cab: "#D2782A", sky: ["#BDE5FF", "#E8F6FF"], far: "#B9E3A0", near: "#8ACB6E", ground: ["#8ED07A", "#7BC267"], rim: "#5DA449", hat: "ears",    scene: "park" },
    arcade:      { name: "Candy Arcade", primary: "#FF5CA8", secondary: "#4EA8F5", cab: "#D63C8A", sky: ["#FFD9EF", "#FFF1F9"], far: "#F7B6D8", near: "#C58BE8", ground: ["#B795F5", "#A582EA"], rim: "#7F5BD0", hat: "none",    scene: "grid" },
    forest:      { name: "Wild Woods",   primary: "#7BC74D", secondary: "#FFC93C", cab: "#4E9A2F", sky: ["#D7F1C6", "#F0FAE8"], far: "#A8DA8A", near: "#5FAE4F", ground: ["#A5DA78", "#92CC64"], rim: "#6BAE45", hat: "none",    scene: "forest" },
    ocean:       { name: "Lagoon",       primary: "#22B8D8", secondary: "#FF8A5C", cab: "#1590AD", sky: ["#A6E8F7", "#DDF7FC"], far: "#62CDE6", near: "#2FAFD3", ground: ["#F6DF9F", "#EDD087"], rim: "#D1AF5E", hat: "shades",  scene: "ocean" },
    sunset:      { name: "Golden Hour",  primary: "#FF8A5C", secondary: "#9B7BFF", cab: "#E06A3C", sky: ["#FFC9A6", "#FFE9D7"], far: "#F7A98F", near: "#E2807A", ground: ["#F7BA78", "#EFAA62"], rim: "#CF8A44", hat: "shades",  scene: "grid" },
  };
  for (const [id, t] of Object.entries(THEMES)) t.id = id;

  const AREA_DEFAULTS = {
    work: { theme: "work", icon: "briefcase" },
    mba: { theme: "mba", icon: "graduation-cap" },
    apartment: { theme: "apartment", icon: "house" },
    appartement: { theme: "apartment", icon: "house" },
    money: { theme: "money", icon: "wallet" },
    travel: { theme: "travel", icon: "plane" },
    health: { theme: "health", icon: "heart-pulse" },
    fitness: { theme: "fitness", icon: "dumbbell" },
    errands: { theme: "errands", icon: "clipboard-check" },
    family: { theme: "family", icon: "users" },
    possessions: { theme: "possessions", icon: "package" },
    murphy: { theme: "murphy", icon: "dog" },
  };

  const AREA_ICONS = [
    "briefcase", "graduation-cap", "house", "wallet", "plane", "heart-pulse", "dumbbell", "clipboard-check",
    "users", "package", "dog", "paw-print", "bone", "star", "car", "palette", "music", "book-open", "code",
    "gamepad-2", "leaf", "baby", "coffee", "shopping-cart", "sparkles", "wrench", "globe",
  ];

  // ---------- helpers ----------
  function rng(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const f = (n) => Math.round(n * 10) / 10;
  const cloud = (x, y, k = 1, o = 1) =>
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})" fill="#fff" opacity="${o}"><circle cx="0" cy="0" r="26"/><circle cx="30" cy="-14" r="34"/><circle cx="66" cy="0" r="26"/><rect x="0" y="0" width="66" height="26"/></g>`;
  const sun = (x, y, r, c = "#FFE07A") => `<circle cx="${x}" cy="${y}" r="${r + 18}" fill="${c}" opacity=".35"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  const tree = (x, base, h, c1, c2) =>
    `<rect x="${f(x - 5)}" y="${f(base - h * 0.45)}" width="10" height="${f(h * 0.45)}" rx="3" fill="#B07A4C"/><circle cx="${f(x)}" cy="${f(base - h * 0.62)}" r="${f(h * 0.3)}" fill="${c1}"/><circle cx="${f(x + h * 0.08)}" cy="${f(base - h * 0.68)}" r="${f(h * 0.16)}" fill="${c2}" opacity=".55"/>`;
  const heart = (x, y, k, c, o = 1) => `<path transform="translate(${f(x)} ${f(y)}) scale(${f(k)})" d="M0 6C-12-6-6-16 0-9C6-16 12-6 0 6Z" fill="${c}" opacity="${o}"/>`;

  // ---------- scenes (viewBox 1200 x 500, bottom-anchored) ----------
  const SCENES = {
    skyline(t, r) {
      let s = sun(990, 100, 44) + cloud(140, 90, 1.1) + cloud(560, 60, 0.8, 0.9) + cloud(820, 150, 0.7, 0.8);
      for (let x = -20; x < 1220;) { const w = 60 + r() * 70, h = 170 + r() * 190; s += `<rect x="${f(x)}" y="${f(500 - h)}" width="${f(w)}" height="${f(h)}" rx="3" fill="${t.far}"/>`; x += w + 6; }
      for (let x = -30; x < 1230;) {
        const w = 90 + r() * 80, h = 110 + r() * 160, y = 500 - h;
        s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="4" fill="${t.near}"/>`;
        if (r() > 0.6) s += `<rect x="${f(x + w * 0.2)}" y="${f(y - 18)}" width="22" height="18" rx="3" fill="${t.near}"/>`;
        for (let wy = y + 18; wy < 480; wy += 26) for (let wx = x + 14; wx < x + w - 16; wx += 22)
          s += `<rect x="${f(wx)}" y="${f(wy)}" width="11" height="14" rx="2" fill="${r() < 0.18 ? "#FFE7A3" : "#fff"}" opacity="${r() < 0.18 ? 1 : 0.45}"/>`;
        x += w + 10;
      }
      return s;
    },
    campus(t, r) {
      let s = sun(180, 100, 40) + cloud(380, 80, 0.9) + cloud(900, 70, 1.1) + cloud(1080, 160, 0.6, 0.85);
      s += `<path d="M0 420 Q300 360 600 400 T1200 380 V500 H0Z" fill="#A8DD92"/>`;
      for (const [x, h] of [[90, 200], [190, 160], [1010, 190], [1110, 220]]) s += tree(x, 440, h, "#6DBE5A", "#9BDB7F");
      s += `<rect x="380" y="300" width="440" height="160" fill="${t.far}"/><path d="M360 300 L600 220 L840 300Z" fill="${t.near}"/><rect x="360" y="296" width="480" height="14" fill="#fff"/>`;
      for (let i = 0; i < 7; i++) s += `<rect x="${404 + i * 62}" y="318" width="22" height="130" rx="3" fill="#fff"/>`;
      s += `<rect x="350" y="448" width="500" height="16" fill="#fff"/><rect x="330" y="462" width="540" height="16" fill="#EDE8FF"/><circle cx="600" cy="268" r="14" fill="${t.secondary}"/>`;
      s += `<rect x="598" y="150" width="4" height="72" fill="#7A6B9E"/><path d="M602 152 h44 l-10 12 10 12 h-44z" fill="${t.primary}"/>`;
      return s;
    },
    lamps(t) {
      let s = `<rect x="0" y="330" width="1200" height="170" fill="${t.far}"/><rect x="0" y="322" width="1200" height="10" fill="${t.near}"/>`;
      s += `<rect x="70" y="110" width="230" height="200" rx="8" fill="#BFE6FF" stroke="#fff" stroke-width="14"/>` + cloud(110, 190, 0.7) + `<path d="M185 110v200M70 210h230" stroke="#fff" stroke-width="10"/>`;
      s += `<path d="M48 96 h40 v232 q-20 -40 -40 0z" fill="${t.secondary}"/><path d="M282 96 h40 v232 q-20 -40 -40 0z" fill="${t.secondary}"/><rect x="40" y="88" width="290" height="10" rx="5" fill="${t.near}"/>`;
      s += `<rect x="400" y="150" width="110" height="80" rx="4" fill="#fff" stroke="${t.near}" stroke-width="8"/><path d="M415 215 l30-34 22 22 14-12 18 24z" fill="${t.secondary}"/><circle cx="485" cy="175" r="9" fill="${t.primary}"/>`;
      for (const x of [700, 960]) {
        s += `<path d="M${x - 70} 300 L${x - 34} 130 H${x + 34} L${x + 70} 300Z" fill="#FFF3C4" opacity=".55"/>`;
        s += `<path d="M${x} 0v88" stroke="${t.near}" stroke-width="4"/><path d="M${x - 42} 132 Q${x} 64 ${x + 42} 132Z" fill="${t.primary}"/><circle cx="${x}" cy="134" r="9" fill="#FFF3C4"/>`;
      }
      s += `<rect x="1060" y="400" width="80" height="100" rx="10" fill="#E07B1F"/><g fill="#5FAE4F">`;
      for (const [cx, cy, rot] of [[1080, 372, -30], [1112, 362, 25], [1098, 342, 0], [1066, 398, -55], [1128, 394, 55]]) s += `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="36" transform="rotate(${rot} ${cx} ${cy})"/>`;
      return s + "</g>";
    },
    coins(t, r) {
      let s = sun(1040, 90, 36) + cloud(120, 80, 0.9) + cloud(700, 60, 0.7, 0.9);
      for (let i = 0; i < 11; i++) { const h = 70 + i * 24 + r() * 40; s += `<rect x="${50 + i * 108}" y="${f(500 - h)}" width="72" height="${f(h)}" rx="10" fill="${t.far}"/>`; }
      s += `<polyline points="60,430 230,380 380,400 560,300 720,320 900,210 1070,150" fill="none" stroke="${t.near}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M1094 140l-44-6 22 40z" fill="${t.near}"/>`;
      for (let i = 0; i < 11; i++) {
        const x = r() * 1200, y = 60 + r() * 260, k = 0.7 + r() * 0.8, rot = r() * 40 - 20;
        s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(k)})"><circle r="22" fill="${t.secondary}" stroke="#D99A00" stroke-width="4"/><path d="M5-8c-3-3-12-3-12 2.5s12 3 12 8-9 5-12 2M-1-13v26" stroke="#B57F00" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>`;
      }
      return s;
    },
    clouds(t, r) {
      let s = sun(940, 140, 70, "#FFD45C");
      for (let i = 0; i < 6; i++) s += cloud(r() * 1100, 70 + r() * 230, 0.7 + r() * 0.8, f(0.75 + r() * 0.25));
      s += `<path d="M0 400 Q150 380 300 400 T600 400 T900 400 T1200 400 V500 H0Z" fill="${t.far}"/><path d="M0 430 Q150 410 300 430 T600 430 T900 430 T1200 430 V500 H0Z" fill="${t.near}"/>`;
      s += `<path d="M90 300 Q 300 200 520 220" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="4 16" stroke-linecap="round"/>`;
      s += `<g transform="translate(560 214) rotate(-10) scale(2.2)"><path d="M-16 0h26l9-3c4 0 4 6 0 6l-9-3" fill="#fff" stroke="${INK}" stroke-width="1"/><path d="M-3 0l-10-13h5l13 13z" fill="${t.primary}"/><path d="M-3 0l-10 13h5l13-13z" fill="${t.primary}"/><path d="M-16 0l-5-7h3l7 7z" fill="${t.primary}"/></g>`;
      s += `<g transform="translate(250 120)"><path d="M-34 0a34 38 0 1 1 68 0q0 22-22 40h-24q-22-18-22-40z" fill="${t.primary}"/><path d="M-12-37q-10 30 0 77M12-37q10 30 0 77" stroke="#fff" stroke-width="7" fill="none" opacity=".9"/><path d="M-10 42h20l-3 14h-14z" fill="#B07A4C"/></g>`;
      return s;
    },
    pulse(t) {
      let s = "";
      for (let x = 0; x <= 1200; x += 40) s += `<path d="M${x} 0V500" stroke="${t.far}" stroke-width="2"/>`;
      for (let y = 0; y <= 500; y += 40) s += `<path d="M0 ${y}H1200" stroke="${t.far}" stroke-width="2"/>`;
      let p = "0,230";
      for (let x = 0; x < 1200; x += 300) p += ` ${x + 120},230 ${x + 140},200 ${x + 160},230 ${x + 180},230 ${x + 195},110 ${x + 212},320 ${x + 228},230 ${x + 300},230`;
      s += `<polyline points="${p}" fill="none" stroke="${t.secondary}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>`;
      s += heart(1030, 120, 5, t.secondary, 0.25);
      s += `<g transform="translate(180 120)"><rect x="-36" y="-12" width="72" height="24" rx="5" fill="${t.secondary}" opacity=".3"/><rect x="-12" y="-36" width="24" height="72" rx="5" fill="${t.secondary}" opacity=".3"/></g>`;
      return s;
    },
    gym(t) {
      let s = `<rect x="0" y="340" width="1200" height="160" fill="${t.far}"/><rect x="0" y="330" width="1200" height="12" fill="${t.near}"/>`;
      for (const x of [160, 1040]) {
        s += `<rect x="${x - 8}" y="80" width="16" height="260" fill="${t.near}"/><rect x="${x - 80}" y="130" width="160" height="12" rx="6" fill="${t.near}"/>`;
        for (const dx of [-64, -46, 46, 64]) s += `<rect x="${x + dx - 8}" y="92" width="16" height="88" rx="5" fill="${INK}" opacity=".55"/>`;
      }
      s += `<g transform="translate(600 150)" fill="${t.near}" opacity=".45"><rect x="-110" y="-10" width="220" height="20" rx="10"/><rect x="-136" y="-48" width="28" height="96" rx="10"/><rect x="108" y="-48" width="28" height="96" rx="10"/></g>`;
      return s;
    },
    errands(t, r) {
      let s = sun(1040, 96, 40) + cloud(180, 84, 0.95) + cloud(680, 70, 0.75, 0.9);
      for (let x = 20; x < 1180; x += 190) {
        const h = 160 + (x % 3) * 45;
        s += `<rect x="${x}" y="${500 - h}" width="150" height="${h}" rx="6" fill="${t.far}"/>`;
        s += `<path d="M${x - 8} ${500 - h + 36} H${x + 158} L${x + 146} ${500 - h} H${x + 4}Z" fill="${t.primary}" opacity=".55"/>`;
      }
      s += `<g transform="translate(580 180)"><circle r="44" fill="#fff" stroke="${t.near}" stroke-width="8"/><path d="M0 -26V0L18 12" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
      return s;
    },
    hearts(t, r) {
      let s = cloud(820, 90, 0.9) + cloud(160, 140, 0.7, 0.9);
      s += `<path d="M-20 40 Q 600 170 1220 40" fill="none" stroke="${t.near}" stroke-width="3"/>`;
      for (let i = 0; i <= 18; i++) {
        const x = -20 + i * 69, u = (x + 20) / 1240, y = 40 + 260 * u * (1 - u);
        s += `<circle cx="${f(x)}" cy="${f(y + 10)}" r="8" fill="${[t.primary, t.secondary, "#fff"][i % 3]}" stroke="${t.near}" stroke-width="2"/>`;
      }
      for (let i = 0; i < 12; i++) s += heart(r() * 1200, 140 + r() * 200, 1.5 + r() * 3, t.primary, f(0.2 + r() * 0.35));
      s += `<path d="M0 420 Q600 380 1200 420 V500 H0Z" fill="#B5E39B"/>`;
      s += `<g transform="translate(900 300)"><rect x="0" y="40" width="190" height="130" fill="#fff"/><path d="M-16 46 L95 -30 L206 46Z" fill="${t.primary}"/><rect x="24" y="70" width="40" height="36" rx="4" fill="#FFE07A"/><rect x="126" y="70" width="40" height="36" rx="4" fill="#FFE07A"/><rect x="78" y="100" width="36" height="70" rx="4" fill="${t.near}"/></g>`;
      for (let x = 20; x < 860; x += 34) s += `<path d="M${x} 470v-46l10-12 10 12v46z" fill="#fff"/>`;
      s += `<rect x="0" y="436" width="860" height="8" fill="#fff"/>` + tree(1140, 470, 230, "#6DBE5A", "#9BDB7F");
      return s;
    },
    crates(t, r) {
      let s = "";
      for (const y of [210, 350]) s += `<rect x="0" y="${y}" width="1200" height="12" fill="${t.near}"/>`;
      for (let x = 30; x < 1200; x += 290) s += `<rect x="${x}" y="70" width="12" height="430" fill="${t.near}"/>`;
      const boxes = ["#E7BC80", "#D9A266", "#CC9152", "#EBC995"];
      for (const shelf of [210, 350]) {
        for (let x = 52; x < 1180;) {
          const w = 64 + r() * 70, h = 54 + r() * 60, c = boxes[Math.floor(r() * 4)];
          if (x + w > 1180) break;
          s += `<rect x="${f(x)}" y="${f(shelf - h)}" width="${f(w)}" height="${f(h)}" rx="4" fill="${c}"/><rect x="${f(x + w / 2 - 7)}" y="${f(shelf - h)}" width="14" height="${f(h)}" fill="#F6E2BC"/>`;
          if (r() > 0.55) s += `<rect x="${f(x + 8)}" y="${f(shelf - h + 10)}" width="22" height="14" rx="2" fill="#fff"/>`;
          x += w + 8 + r() * 30;
        }
      }
      for (const x of [320, 900]) s += `<path d="M${x} 0v40" stroke="${t.near}" stroke-width="4"/><path d="M${x - 36} 66 L${x - 18} 40 H${x + 18} L${x + 36} 66Z" fill="${t.primary}"/>`;
      return s;
    },
    grid(t) {
      const sy = t.sky[1];
      let s = `<circle cx="600" cy="300" r="170" fill="${t.primary}"/><path d="M430 300 A170 170 0 0 1 770 300Z" fill="${t.secondary}" opacity=".35"/>`;
      for (let i = 0; i < 6; i++) s += `<rect x="420" y="${236 + i * 22}" width="360" height="${4 + i * 2.4}" fill="${sy}"/>`;
      s += `<path d="M0 340 L160 240 L280 310 L420 210 L560 340Z M640 340 L760 230 L880 290 L1020 200 L1200 340Z" fill="${t.near}"/>`;
      s += `<rect x="0" y="340" width="1200" height="160" fill="${t.far}"/>`;
      for (let i = -12; i <= 12; i++) s += `<path d="M600 340 L${600 + i * 130} 500" stroke="#fff" stroke-width="3" opacity=".75"/>`;
      for (const y of [348, 360, 378, 404, 440, 488]) s += `<path d="M0 ${y}H1200" stroke="#fff" stroke-width="3" opacity=".75"/>`;
      return s + cloud(120, 110, 0.8) + cloud(980, 90, 1);
    },
    forest(t, r) {
      let s = sun(920, 110, 46) + cloud(200, 90, 1) + cloud(640, 70, 0.7, 0.9);
      s += `<path d="M0 380 Q300 300 600 360 T1200 340 V500 H0Z" fill="${t.far}"/>`;
      const layer = (n, base, hmin, hmax, col) => {
        for (let i = 0; i < n; i++) { const x = (i / n) * 1240 - 20 + r() * 30, h = hmin + r() * (hmax - hmin), w = h * 0.5;
          s += `<rect x="${f(x - 5)}" y="${f(base - 24)}" width="10" height="24" fill="#9A6A3F"/><path d="M${f(x)} ${f(base - h)} L${f(x + w / 2)} ${base - 18} H${f(x - w / 2)}Z" fill="${col}"/>`; }
      };
      layer(16, 440, 150, 220, t.near); layer(10, 500, 200, 300, "#3F8F3A");
      for (let i = 0; i < 5; i++) { const x = 300 + r() * 600, y = 80 + r() * 120; s += `<path d="M${f(x)} ${f(y)} q8 -8 16 0 q8 -8 16 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`; }
      return s;
    },
    ocean(t, r) {
      let s = sun(930, 120, 54, "#FFE07A") + cloud(150, 90, 0.9) + cloud(560, 60, 0.7, 0.9);
      const wave = (y, a, col) => { let d = `M0 ${y}`; for (let x = 0; x <= 1200; x += 100) d += ` Q${x + 50} ${y - a} ${x + 100} ${y}`; return `<path d="${d} V500 H0Z" fill="${col}"/>`; };
      s += wave(330, 16, t.far) + wave(380, 14, t.near);
      s += `<path d="M180 500 C200 420 210 360 250 300" stroke="#C98A4B" stroke-width="18" fill="none" stroke-linecap="round"/><g fill="#4FAE4A">`;
      for (const rot of [-70, -30, 10, 50, 100]) s += `<ellipse cx="250" cy="300" rx="80" ry="18" transform="rotate(${rot} 250 300) translate(60 0)"/>`;
      s += `</g>`;
      for (let i = 0; i < 4; i++) { const x = 400 + r() * 600, y = 140 + r() * 100; s += `<path d="M${f(x)} ${f(y)} q10 -10 20 0 q10 -10 20 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`; }
      s += `<g transform="translate(980 330)"><path d="M-30 0 Q0 -24 30 0 Q0 24 -30 0Z" fill="${t.secondary}"/><path d="M28 0 l18 -12 v24z" fill="${t.secondary}"/><circle cx="-14" cy="-3" r="3.5" fill="${INK}"/></g>`;
      return s;
    },
    park(t, r) {
      let s = sun(1020, 100, 42) + cloud(140, 80, 1) + cloud(560, 110, 0.75, 0.9);
      s += `<path d="M0 360 Q260 280 560 340 T1200 320 V500 H0Z" fill="${t.far}"/><path d="M0 420 Q300 380 640 410 T1200 400 V500 H0Z" fill="${t.near}"/>`;
      for (const [x, h] of [[80, 230], [190, 180], [1120, 210]]) s += tree(x, 440, h, "#5FAE4F", "#8ED07A");
      for (let x = 300; x < 760; x += 32) s += `<path d="M${x} 452v-50l10-12 10 12v50z" fill="#fff"/>`;
      s += `<rect x="300" y="414" width="460" height="9" fill="#fff"/>`;
      s += `<g transform="translate(830 290)"><rect x="0" y="50" width="180" height="120" fill="${t.primary}"/><path d="M-20 56 L90 -20 L200 56Z" fill="#E5484D"/><path d="M60 170 v-56 a30 30 0 0 1 60 0 v56z" fill="#3B2416"/><rect x="40" y="64" width="100" height="26" rx="5" fill="#fff"/><text x="90" y="83" text-anchor="middle" font-family="'Lilita One', 'Arial Rounded MT Bold', sans-serif" font-size="18" fill="${INK}">MURPHY</text></g>`;
      s += `<g transform="translate(560 470) rotate(-15)"><rect x="-26" y="-6" width="52" height="12" rx="6" fill="#fff"/><circle cx="-26" cy="-7" r="8" fill="#fff"/><circle cx="-26" cy="7" r="8" fill="#fff"/><circle cx="26" cy="-7" r="8" fill="#fff"/><circle cx="26" cy="7" r="8" fill="#fff"/></g>`;
      s += `<circle cx="690" cy="476" r="16" fill="${t.secondary}"/><path d="M676 470 q14 12 28 0" stroke="#fff" stroke-width="3" fill="none"/>`;
      s += `<g transform="translate(260 418)"><rect x="-14" y="0" width="28" height="44" rx="6" fill="#E5484D"/><rect x="-20" y="-8" width="40" height="12" rx="6" fill="#E5484D"/><circle cx="0" cy="-12" r="10" fill="#E5484D"/></g>`;
      for (let i = 0; i < 6; i++) { const x = 380 + i * 70, y = 360 - i * 6; s += `<g fill="#fff" opacity=".6" transform="translate(${x} ${y}) rotate(20)"><ellipse cx="0" cy="6" rx="7" ry="6"/><circle cx="-7" cy="-4" r="3"/><circle cx="0" cy="-7" r="3"/><circle cx="7" cy="-4" r="3"/></g>`; }
      return s;
    },
  };

  function sceneSVG(themeId, cls = "scene-svg") {
    const t = THEMES[themeId] || THEMES.arcade;
    return `<svg class="${cls}" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">${SCENES[t.scene](t, rng(themeId + "-scene"))}</svg>`;
  }

  // ---------- mole art (viewBox 120 x 130, flat + ink outline) ----------
  const MI = "#3B2416";
  const HATS = {
    none: () => "",
    tie: (t) => `<path d="M46 86l14 6 14-6-3 9H49z" fill="#fff" stroke="${MI}" stroke-width="2"/><path d="M56 90h8l-1.5 6h-5z" fill="${t.primary}" stroke="${MI}" stroke-width="2"/><path d="M57 96h6l5 22-8 8-8-8z" fill="${t.primary}" stroke="${MI}" stroke-width="2"/>`,
    grad: (t) => `<path d="M40 22v12q20 9 40 0V22z" fill="#2E2A45" stroke="${MI}" stroke-width="2.5"/><path d="M60 6l40 13-40 13-40-13z" fill="#3D3760" stroke="${MI}" stroke-width="2.5" stroke-linejoin="round"/><path d="M60 19l30 4v16" fill="none" stroke="${t.secondary}" stroke-width="3" stroke-linecap="round"/><circle cx="90" cy="41" r="4.5" fill="${t.secondary}" stroke="${MI}" stroke-width="2"/>`,
    hardhat: () => `<path d="M30 33Q30 7 60 7Q90 7 90 33Z" fill="#FFC93C" stroke="${MI}" stroke-width="2.5"/><rect x="56" y="7" width="8" height="25" rx="3" fill="#FFE07A" stroke="${MI}" stroke-width="2"/><rect x="22" y="30" width="76" height="9" rx="4.5" fill="#F4B000" stroke="${MI}" stroke-width="2.5"/>`,
    visor: (t) => `<path d="M28 36Q60 22 92 36v6Q60 28 28 42z" fill="${t.primary}" stroke="${MI}" stroke-width="2.5" stroke-linejoin="round"/><path d="M34 40Q60 32 86 40Q80 47 60 47Q40 47 34 40Z" fill="${t.primary}" stroke="${MI}" stroke-width="2.5"/>`,
    shades: (t) => `<path d="M32 49h23q2 14-11 14t-12-14z" fill="${INK}" stroke="${MI}" stroke-width="2"/><path d="M65 49h23q0 14-12 14t-11-14z" fill="${INK}" stroke="${MI}" stroke-width="2"/><path d="M55 51q5-3 10 0" stroke="${MI}" stroke-width="3" fill="none"/><path d="M37 53h7M70 53h7" stroke="${t.primary}" stroke-width="3" stroke-linecap="round"/>`,
    band: (t) => `<rect x="27" y="33" width="66" height="12" rx="6" fill="${t.primary}" stroke="${MI}" stroke-width="2.5"/><rect x="29" y="38" width="62" height="2.5" fill="#fff"/><path d="M90 40l12 6-3 7-11-4z" fill="${t.primary}" stroke="${MI}" stroke-width="2"/>`,
    med: (t) => `<rect x="28" y="32" width="64" height="10" rx="5" fill="#fff" stroke="${MI}" stroke-width="2.5"/><circle cx="60" cy="30" r="11" fill="#E9F5FF" stroke="${MI}" stroke-width="2.5"/><path d="M55 30h10M60 25v10" stroke="${t.secondary}" stroke-width="3" stroke-linecap="round"/>`,
    cap: (t) => `<path d="M30 33Q30 9 60 9Q90 9 90 33Z" fill="${t.primary}" stroke="${MI}" stroke-width="2.5"/><path d="M60 9Q74 15 74 33" fill="none" stroke="${MI}" stroke-width="2" opacity=".35"/><path d="M26 31h72q8 0 8 5t-12 5H26Z" fill="${t.secondary}" stroke="${MI}" stroke-width="2.5"/><circle cx="60" cy="9" r="3.5" fill="${t.secondary}" stroke="${MI}" stroke-width="2"/>`,
    bow: (t) => `<path d="M82 22L66 11l2 22zM82 22l16-11-2 22z" fill="${t.primary}" stroke="${MI}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="82" cy="22" r="5.5" fill="${t.secondary}" stroke="${MI}" stroke-width="2"/>`,
    box: () => `<g transform="rotate(-9 60 16)"><rect x="38" y="0" width="44" height="26" rx="3" fill="#E7BC80" stroke="${MI}" stroke-width="2.5"/><rect x="55" y="1" width="10" height="24" fill="#F6E2BC"/><path d="M42 16h8M42 20h6" stroke="${MI}" stroke-width="1.8"/></g>`,
    ears: (t) => `<path d="M34 28C14 30 8 62 18 80C30 78 34 56 42 40Z" fill="#7A4A2A" stroke="${MI}" stroke-width="3" stroke-linejoin="round"/><path d="M86 28C106 30 112 62 102 80C90 78 86 56 78 40Z" fill="#7A4A2A" stroke="${MI}" stroke-width="3" stroke-linejoin="round"/><path d="M22 97Q60 110 98 97L98 106Q60 119 22 106Z" fill="${t.secondary}" stroke="${MI}" stroke-width="2.5"/><circle cx="60" cy="116" r="6.5" fill="#FFC93C" stroke="${MI}" stroke-width="2.5"/>`,
  };

  function eyes(mood) {
    if (mood === "sleepy") return `<path d="M36 56q8 6 16 0M68 56q8 6 16 0" stroke="${MI}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    const p = mood === "angry" ? 3.8 : 4.8;
    return `<g class="eyes${mood === "angry" ? "" : " blink"}"><ellipse cx="44" cy="55" rx="8.5" ry="9.5" fill="#fff" stroke="${MI}" stroke-width="2.5"/><ellipse cx="76" cy="55" rx="8.5" ry="9.5" fill="#fff" stroke="${MI}" stroke-width="2.5"/><circle cx="45.5" cy="57" r="${p}" fill="${MI}"/><circle cx="74.5" cy="57" r="${p}" fill="${MI}"/><circle cx="47" cy="54.5" r="1.6" fill="#fff"/><circle cx="76" cy="54.5" r="1.6" fill="#fff"/></g>` +
      (mood === "angry" ? `<path d="M33 41l18 8M87 41l-18 8" stroke="${MI}" stroke-width="4.5" stroke-linecap="round"/>` : "");
  }

  function moleSVG(themeId, mood = "normal") {
    const t = THEMES[themeId] || THEMES.arcade;
    const angry = mood === "angry";
    const body = angry ? "#F0604D" : "#A87452", shade = angry ? "#D1483A" : "#8C5C3F", belly = angry ? "#FFD6C8" : "#F6DDBF";
    const mouth = angry
      ? `<path d="M50 83q10-8 20 0" stroke="${MI}" stroke-width="3" fill="#7A1F1F" stroke-linecap="round"/>`
      : mood === "sleepy" ? `<ellipse cx="60" cy="83" rx="4" ry="3" fill="${MI}"/>`
      : `<path d="M51 79q9 7 18 0" stroke="${MI}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M55 81h10v7q-5 2-10 0z" fill="#fff" stroke="${MI}" stroke-width="1.8"/><path d="M60 81v8" stroke="${MI}" stroke-width="1.5"/>`;
    const steam = angry ? `<g class="steam" fill="#fff" stroke="${MI}" stroke-width="2"><circle cx="18" cy="22" r="6"/><circle cx="10" cy="11" r="4"/><circle cx="102" cy="22" r="6"/><circle cx="110" cy="11" r="4"/></g>` : "";
    const zz = mood === "sleepy" ? `<g class="zz" fill="#fff" stroke="${MI}" stroke-width="1.2" font-family="'Lilita One', sans-serif"><text x="92" y="30" font-size="16">z</text><text x="103" y="15" font-size="11">z</text></g>` : "";
    return `<svg viewBox="0 0 120 130" class="mole-svg" aria-hidden="true" focusable="false">
      ${steam}
      <path d="M16 134C16 58 30 16 60 16S104 58 104 134Z" fill="${body}"/>
      <path d="M104 134C104 66 92 28 68 18C86 34 92 70 92 134Z" fill="${shade}"/>
      <ellipse cx="60" cy="110" rx="28" ry="30" fill="${belly}"/>
      <path d="M16 134C16 58 30 16 60 16S104 58 104 134" fill="none" stroke="${MI}" stroke-width="3.5"/>
      <ellipse cx="33" cy="71" rx="7" ry="4.5" fill="#FF9EB5" opacity=".7"/><ellipse cx="87" cy="71" rx="7" ry="4.5" fill="#FF9EB5" opacity=".7"/>
      ${eyes(mood)}
      <path d="M42 70l-20-3M42 74l-19 4M78 70l20-3M78 74l19 4" stroke="${MI}" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="60" cy="70" rx="9.5" ry="7" fill="#FF8FAB" stroke="${MI}" stroke-width="2.5"/><ellipse cx="57" cy="68" rx="3" ry="2" fill="#fff" opacity=".8"/>
      ${mouth}
      ${HATS[t.hat](t)}
      ${zz}
    </svg>`;
  }

  window.WAL_THEMES = { THEMES, AREA_DEFAULTS, AREA_ICONS, sceneSVG, moleSVG, INK };
})();
