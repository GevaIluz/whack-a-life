/* Whack-a-Life */
(() => {
  "use strict";

  const { THEMES, AREA_DEFAULTS, AREA_ICONS, sceneSVG, moleSVG, INK } = window.WAL_THEMES;
  const { TYPES, PICKABLE, typeFor } = window.WAL_PARK;
  const ICONS = window.WAL_ICONS;

  const STORAGE_KEY = "whack-a-life-v1";
  const SYNC_KEY = "whack-a-life-sync-v1";
  const GIST_FILENAME = "whack-a-life-sync.json";
  const DEFAULT_GIST_ID = "05466cbaca8486f92f45f3909f9be49e";
  const BIRTH_DATE = "1998-10-03";
  const DEFAULT_AREAS = ["Work", "MBA", "Apartment", "Money", "Travel", "Health", "Fitness", "Errands", "Family", "Possessions", "Murphy"];
  const URG = {
    low: { label: "Chill", weight: 1, mood: "sleepy" },
    medium: { label: "Normal", weight: 2, mood: "normal" },
    high: { label: "Urgent", weight: 4, mood: "angry" },
  };
  const URG_ORDER = ["low", "medium", "high"];
  const WORDS = ["BONK!", "WHACK!", "POW!", "SMASH!", "BAM!", "DONE!"];
  const PRACTICE = ["Answer emails", "Laundry", "Book dentist", "Pay bills", "Groceries", "Call mom", "Walk Murphy", "Submit report", "Clean desk", "Renew passport", "Gym session", "Read chapter 4"];
  const PLAY_SECONDS = 30;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const narrowMQ = window.matchMedia("(max-width: 860px)");

  // ---------------- utils ----------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (name, cls = "") =>
    `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.star}</svg>`;
  const hydrateIcons = (root = document) => $$("i[data-icon]", root).forEach((i) => (i.outerHTML = icon(i.dataset.icon)));
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const norm = (t) => String(t).trim().toLowerCase();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const dayKey = (d = new Date()) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  };
  const keyToDate = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = keyToDate(k); d.setDate(d.getDate() + n); return dayKey(d); };
  const fmtDate = (k) => keyToDate(k).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  // ---------------- state ----------------
  function freshState() {
    return {
      version: 4,
      updatedAt: 0,
      areas: DEFAULT_AREAS.map((name, i) => ({ id: uid(), name, order: i, updatedAt: 0 })),
      moles: [],
      history: [],
      deletedIds: {},
      settings: { muted: false, birthDate: BIRTH_DATE, playBest: 0 },
      addedMurphy: true,
      addedFitness: true,
      addedErrands: true,
    };
  }
  function migrate(s) {
    s.history ||= []; s.settings ||= {}; s.deletedIds ||= {};
    s.updatedAt ??= 0;
    s.settings.muted ??= false;
    s.settings.birthDate ??= BIRTH_DATE;
    s.settings.playBest ??= 0;
    delete s.score; delete s.settings.dailyGoal;
    const cutoff = Date.now() - 45 * 86400e3;
    for (const [k, ts] of Object.entries(s.deletedIds)) if (ts < cutoff) delete s.deletedIds[k];
    if (!s.addedMurphy) {
      if (!s.areas.some((a) => a.name.trim().toLowerCase() === "murphy"))
        s.areas.push({ id: uid(), name: "Murphy", order: Math.max(-1, ...s.areas.map((a) => a.order ?? 0)) + 1, updatedAt: 0 });
      s.addedMurphy = true;
    }
    if (!s.addedFitness) {
      let fit = s.areas.find((a) => a.name.trim().toLowerCase() === "fitness");
      const healthIdx = s.areas.findIndex((a) => a.name.trim().toLowerCase() === "health");
      if (!fit) {
        fit = { id: uid(), name: "Fitness", theme: "fitness", icon: "dumbbell", type: "gym", order: 0, updatedAt: 0 };
        if (healthIdx >= 0) s.areas.splice(healthIdx + 1, 0, fit);
        else s.areas.push(fit);
        s.areas.forEach((a, i) => { a.order = i; });
      }
      const health = s.areas.find((a) => a.name.trim().toLowerCase() === "health");
      if (health && fit) {
        const fitRe = /\b(kg|weight|work\s*out|workout|gym|fitness|body|muscle)\b/i;
        for (const m of s.moles) {
          if (m.areaId === health.id && fitRe.test(m.title)) {
            m.areaId = fit.id;
            m.updatedAt = Math.max(m.updatedAt || 0, Date.now());
          }
        }
      }
      s.addedFitness = true;
    }
    if (!s.addedErrands) {
      if (!s.areas.some((a) => a.name.trim().toLowerCase() === "errands")) {
        const err = { id: uid(), name: "Errands", theme: "errands", icon: "clipboard-check", type: "errands", order: 0, updatedAt: 0 };
        const fitIdx = s.areas.findIndex((a) => a.name.trim().toLowerCase() === "fitness");
        if (fitIdx >= 0) s.areas.splice(fitIdx + 1, 0, err);
        else s.areas.push(err);
        s.areas.forEach((a, i) => { a.order = i; });
      }
      s.addedErrands = true;
    }
    s.areas.forEach((a, i) => {
      const d = AREA_DEFAULTS[(a.name || "").trim().toLowerCase()] || {};
      if (!THEMES[a.theme]) a.theme = d.theme || "arcade";
      if (!ICONS[a.icon]) a.icon = d.icon || "star";
      if (typeof a.order !== "number") a.order = i;
      a.updatedAt ??= 0;
    });
    s.moles.forEach((m) => { m.updatedAt ??= m.createdAt || 0; });
    s.history.forEach((h) => { h.moleId ||= h.id; });
    s.version = 4;
    return s;
  }
  function mergeStates(localRaw, remoteRaw) {
    const L = migrate(structuredClone(localRaw)), R = migrate(structuredClone(remoteRaw));
    const deletedIds = { ...L.deletedIds };
    for (const [k, ts] of Object.entries(R.deletedIds || {})) deletedIds[k] = Math.max(deletedIds[k] || 0, ts);

    // Merge areas: match by id first, and also unify fresh default areas that share the same normalized name
    const areaMap = new Map();
    const nameMap = new Map();
    const idRemap = new Map();
    const rMoleCount = new Map();
    for (const m of R.moles) rMoleCount.set(m.areaId, (rMoleCount.get(m.areaId) || 0) + 1);
    for (const a of R.areas) {
      areaMap.set(a.id, { ...a });
      nameMap.set(norm(a.name), a.id);
    }
    for (const a of L.areas) {
      if (areaMap.has(a.id)) {
        const ra = areaMap.get(a.id);
        if ((a.updatedAt || 0) >= (ra.updatedAt || 0)) areaMap.set(a.id, { ...ra, ...a });
      } else {
        const sameNameId = nameMap.get(norm(a.name));
        if (sameNameId) {
          const ra = areaMap.get(sameNameId);
          // Unify duplicate default areas across devices, keeping the remote ID as canonical if remote already has data
          const keepRemoteId = (rMoleCount.get(sameNameId) || 0) > 0 || (ra.updatedAt || 0) >= (a.updatedAt || 0);
          if (keepRemoteId) {
            idRemap.set(a.id, sameNameId);
            if ((a.updatedAt || 0) > (ra.updatedAt || 0)) areaMap.set(sameNameId, { ...a, id: sameNameId });
          } else {
            idRemap.set(sameNameId, a.id);
            areaMap.delete(sameNameId);
            areaMap.set(a.id, { ...ra, ...a, id: a.id });
            nameMap.set(norm(a.name), a.id);
          }
        } else {
          areaMap.set(a.id, { ...a });
          nameMap.set(norm(a.name), a.id);
        }
      }
    }
    const remapId = (id) => idRemap.get(id) || id;
    const areas = [...areaMap.values()]
      .filter((a) => !(deletedIds[a.id] && deletedIds[a.id] > (a.updatedAt || 0)))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((a, i) => ({ ...a, order: i }));
    const validAreaIds = new Set(areas.map((a) => a.id));

    // Merge history (whacked moles), skipping any undone history entries
    const moleUpdatedMap = new Map();
    for (const m of [...R.moles, ...L.moles]) {
      const ts = m.updatedAt || m.createdAt || 0;
      moleUpdatedMap.set(m.id, Math.max(moleUpdatedMap.get(m.id) || 0, ts));
    }
    const histMap = new Map();
    const whackedMoleIds = new Set();
    const whackedTitleTime = new Map();
    for (const h of [...R.history, ...L.history]) {
      if (deletedIds[h.id]) continue;
      const entry = { ...h, areaId: remapId(h.areaId), moleId: h.moleId || h.id };
      if ((moleUpdatedMap.get(entry.moleId) || 0) > entry.whackedAt) continue;
      const key = entry.moleId || entry.id;
      const prev = histMap.get(key);
      if (!prev || entry.whackedAt < prev.whackedAt) histMap.set(key, entry);
      whackedMoleIds.add(entry.moleId);
      whackedMoleIds.add(entry.id);
      const tKey = `${entry.areaId}::${norm(entry.title)}`;
      whackedTitleTime.set(tKey, Math.max(whackedTitleTime.get(tKey) || 0, entry.whackedAt || 0));
    }
    const history = [...histMap.values()].sort((a, b) => b.whackedAt - a.whackedAt);

    // Merge open moles (deduplicating by id and by areaId + normalized title)
    const moleMap = new Map();
    const titleKeyMap = new Map();
    for (const m of [...R.moles, ...L.moles]) {
      const item = { ...m, areaId: remapId(m.areaId), updatedAt: m.updatedAt || m.createdAt || 0 };
      if (!validAreaIds.has(item.areaId)) continue;
      if (whackedMoleIds.has(item.id)) continue;
      const tKey = `${item.areaId}::${norm(item.title)}`;
      if ((whackedTitleTime.get(tKey) || 0) >= item.updatedAt && item.updatedAt > 0) continue;
      if (deletedIds[item.id] && deletedIds[item.id] > item.updatedAt) continue;
      const existingIdForTitle = titleKeyMap.get(tKey);
      const canonicalId = existingIdForTitle || item.id;
      const prev = moleMap.get(canonicalId);
      if (!prev || item.updatedAt >= prev.updatedAt) {
        moleMap.set(canonicalId, { ...item, id: canonicalId });
        titleKeyMap.set(tKey, canonicalId);
      }
    }
    const moles = [...moleMap.values()];

    const newer = (L.updatedAt || 0) >= (R.updatedAt || 0) ? L : R;
    const older = newer === L ? R : L;
    const settings = {
      ...older.settings,
      ...newer.settings,
      playBest: Math.max(L.settings?.playBest || 0, R.settings?.playBest || 0),
    };
    const appliedSeeds = [...new Set([...(L.appliedSeeds || []), ...(R.appliedSeeds || [])])];
    return migrate({
      version: 4,
      updatedAt: Math.max(L.updatedAt || 0, R.updatedAt || 0),
      areas,
      moles,
      history,
      deletedIds,
      settings,
      addedMurphy: L.addedMurphy || R.addedMurphy,
      addedFitness: L.addedFitness || R.addedFitness,
      addedErrands: L.addedErrands || R.addedErrands,
      appliedSeeds,
    });
  }
  window.WAL_MERGE_STATES = mergeStates;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (s && Array.isArray(s.areas) && Array.isArray(s.moles)) return migrate(s);
    } catch (e) { console.warn("Could not load saved data", e); }
    return migrate(freshState());
  }
  let scheduleCloudPush = () => {};
  const save = ({ fromSync = false } = {}) => {
    if (!fromSync) state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (!fromSync) scheduleCloudPush();
  };

  let state = load();
  let route = parseHash();
  let justAdded = null;
  let undoTimer = null;
  let hallScroll = 0;
  let lastAreaId = null;
  let hallTab = "floor";

  const sortedAreas = () => [...state.areas].sort((a, b) => a.order - b.order);
  const areaById = (id) => state.areas.find((a) => a.id === id);
  const themeOf = (a) => THEMES[a?.theme] || THEMES.arcade;
  const themeVars = (t) => `--c1:${t.primary};--c2:${t.secondary};--cab:${t.cab};--sky1:${t.sky[0]};--sky2:${t.sky[1]};--g1:${t.ground[0]};--g2:${t.ground[1]};--rim:${t.rim}`;
  const molesOf = (areaId) => sortMoles(state.moles.filter((m) => m.areaId === areaId));

  // ---------------- level = age ----------------
  function levelInfo() {
    const b = keyToDate(state.settings.birthDate || BIRTH_DATE), now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
    const step = ((now.getMonth() - b.getMonth() + 12) % 12) + 1;
    const month = `${step}/12`;
    const isBirthday = now.getMonth() === b.getMonth() && now.getDate() === b.getDate();
    return { age, step, month, isBirthday };
  }

  // ---------------- task rules ----------------
  function moleStatus(m) {
    if (!m.due) return "none";
    const today = dayKey();
    if (m.due < today) return "overdue";
    if (m.due === today) return "today";
    if (m.due === addDays(today, 1)) return "tomorrow";
    return "later";
  }
  const isHot = (m) => m.urgency === "high" || ["overdue", "today"].includes(moleStatus(m));
  const moodOf = (m) => (moleStatus(m) === "overdue" ? "angry" : URG[m.urgency]?.mood || "normal");
  function moleLoad(m) {
    let w = URG[m.urgency]?.weight || 2;
    const st = moleStatus(m);
    if (st === "overdue") w += 4; else if (st === "today") w += 2;
    return w;
  }
  const areaCalm = (id) => Math.max(0, Math.round(100 - state.moles.filter((m) => m.areaId === id).reduce((s, m) => s + moleLoad(m), 0) * 6));
  const lifeCalm = () => state.areas.length ? Math.round(state.areas.reduce((s, a) => s + areaCalm(a.id), 0) / state.areas.length) : 100;
  function calmInfo(c) {
    if (c >= 95) return { label: "Quiet", color: "#3CCB6E" };
    if (c >= 70) return { label: "Calm", color: "#8FD14F" };
    if (c >= 40) return { label: "Busy", color: "#FFC93C" };
    if (c > 0) return { label: "Noisy", color: "#FF8A3D" };
    return { label: "Chaos", color: "#F0473E" };
  }
  function sortMoles(list) {
    const rank = { overdue: 0, today: 1, tomorrow: 2, later: 3, none: 4 };
    const ur = { high: 0, medium: 1, low: 2 };
    return [...list].sort((a, b) => rank[moleStatus(a)] - rank[moleStatus(b)] || ur[a.urgency] - ur[b.urgency] ||
      (a.due || "9999").localeCompare(b.due || "9999") || a.createdAt - b.createdAt);
  }
  function dueText(m) {
    const st = moleStatus(m);
    return st === "overdue" ? `Overdue · ${fmtDate(m.due)}` : st === "today" ? "Due today" : st === "tomorrow" ? "Tomorrow" : st === "later" ? fmtDate(m.due) : "";
  }
  const dueChip = (m) => moleStatus(m) === "none" ? "" :
    `<span class="due-chip ${moleStatus(m)}">${icon(moleStatus(m) === "overdue" ? "zap" : "calendar")}${dueText(m)}</span>`;
  const doneOn = (k) => state.history.filter((h) => dayKey(h.whackedAt) === k).length;

  // ---------------- sound ----------------
  let ac = null;
  const audio = () => { ac ||= new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); return ac; };
  function tone(type, f0, f1, t0, dur, vol) {
    const a = audio(), t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function playWhack() {
    if (state.settings.muted) return;
    const a = audio(), t = a.currentTime;
    tone("sine", 190, 42, 0, 0.22, 0.9);
    const len = Math.floor(a.sampleRate * 0.08), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const n = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    fl.type = "bandpass"; fl.frequency.value = 1700; g.gain.value = 0.55; n.buffer = buf;
    n.connect(fl).connect(g).connect(a.destination); n.start(t);
    tone("square", 880, 1500, 0.06, 0.14, 0.05);
  }
  const playPop = () => { if (!state.settings.muted) tone("triangle", 320, 940, 0, 0.13, 0.25); };
  const playCoin = () => { if (!state.settings.muted) { tone("square", 988, 990, 0, 0.08, 0.07); tone("square", 1319, 1320, 0.08, 0.22, 0.07); } };
  const playBlip = (hi) => { if (!state.settings.muted) tone("square", hi ? 1046 : 523, hi ? 1047 : 524, 0, hi ? 0.3 : 0.12, 0.07); };
  const playFanfare = () => { if (!state.settings.muted) [523, 659, 784, 1047].forEach((fq, i) => tone("square", fq, fq + 1, i * 0.1, 0.18, 0.06)); };

  // ---------------- routing ----------------
  function parseHash() {
    if (location.hash === "#/play") return { view: "play" };
    const m = location.hash.match(/^#\/m\/(.+)$/);
    return m ? { view: "game", id: decodeURIComponent(m[1]) } : { view: "hall" };
  }
  const enter = (id) => { playCoin(); location.hash = `#/m/${encodeURIComponent(id)}`; };
  const enterPlay = () => { playCoin(); location.hash = "#/play"; };
  const screenFor = (r) => r.view === "play" ? $(".mach-play .cab-screen") : r.view === "game" ? $(`.mcard[data-id="${CSS.escape(r.id)}"] .cab-screen`) : null;

  window.addEventListener("hashchange", () => {
    if (location.hash.startsWith("#sync=")) {
      const unpacked = decodeSetupCode(decodeURIComponent(location.hash.slice(6)));
      if (unpacked?.token) {
        syncCfg = { token: unpacked.token, gistId: unpacked.gistId || DEFAULT_GIST_ID, lastSyncAt: 0, dirty: false };
        saveSyncCfg();
        history.replaceState(null, "", "#/");
        syncWithGist({ forcePush: true, notifyUser: true });
        return;
      }
    }
    const prev = route, next = parseHash();
    if (next.view === "game" && !areaById(next.id)) { location.hash = "#/"; return; }
    route = next;
    if (prev.view === "hall") hallScroll = window.scrollY;
    const update = () => {
      renderView({ intro: true });
      if (next.view === "hall") {
        window.scrollTo(0, hallScroll);
        const s = screenFor(prev); if (s) s.style.viewTransitionName = "machine";
      } else window.scrollTo(0, 0);
    };
    if (!document.startViewTransition || reduceMotion.matches) {
      update();
      app.classList.remove("view-enter"); void app.offsetWidth; app.classList.add("view-enter");
      return;
    }
    if (prev.view === "hall") { const s = screenFor(next); if (s) s.style.viewTransitionName = "machine"; }
    document.startViewTransition(update).finished.catch(() => {}).finally(() => $$(".cab-screen").forEach((s) => (s.style.viewTransitionName = "")));
  });

  // ---------------- shared pieces ----------------
  const app = $("#app");

  function renderView(opts = {}) {
    stopPlay();
    if (route.view === "game") {
      const a = areaById(route.id);
      if (!a) { route = { view: "hall" }; history.replaceState(null, "", "#/"); return renderView(opts); }
      renderGame(a, opts);
      document.title = `${a.name} · Whack-a-Life`;
    } else if (route.view === "play") {
      renderPlay();
      document.title = "Free Play · Whack-a-Life";
    } else {
      renderHall();
      document.title = state.moles.length ? `(${state.moles.length}) Whack-a-Life` : "Whack-a-Life";
    }
    justAdded = null;
    if ($("#stats-dialog").open) renderStats();
  }
  const render = () => renderView({ intro: false });

  function hudHTML() {
    const lv = levelInfo(), today = doneOn(dayKey());
    return `<div class="hud" role="group" aria-label="Player">
      <div class="hud-level" title="Your level is your age. It goes up on your birthday.">
        <span class="lv-badge"><small>LV</small>${lv.age}</span>
        <span class="lv-text"><b>Level ${lv.age}</b><small>${lv.month}</small></span>
      </div>
      <div class="hud-pill${today ? " done" : ""}" title="Moles whacked today"><span class="pill-ic">${icon("check")}</span><b>${today}</b><small>done today</small></div>
    </div>`;
  }
  const soundBtn = () => `<button class="icon-btn" data-act="mute" aria-label="${state.settings.muted ? "Turn sound on" : "Mute sound"}" title="${state.settings.muted ? "Sound off" : "Sound on"}">${icon(state.settings.muted ? "volume-x" : "volume-2")}</button>`;
  let syncBtn = () => `<button class="icon-btn sync-btn" data-act="sync" aria-label="Cloud sync" title="Cloud sync">${icon("cloud")}<span class="sync-dot off"></span></button>`;

  // ---------------- hall ----------------
  function runItem(m) {
    const a = areaById(m.areaId), st = moleStatus(m);
    return `<li class="run-item${st === "overdue" ? " is-over" : ""}" style="${themeVars(themeOf(a))}">
      <button class="run-open" data-open="${a.id}" title="Open the ${esc(a.name)} machine">
        <span class="tile sm">${icon(a.icon)}</span>
        <span class="run-text"><b dir="auto">${esc(m.title)}</b><small><span class="run-area">${esc(a.name)}</span>${dueText(m) ? ` · <span class="run-due ${st}">${dueText(m)}</span>` : ` · ${URG[m.urgency].label}`}</small></span>
      </button>
      <button class="whack-btn" data-whack="${m.id}" aria-label="Whack: ${esc(m.title)}" title="Done, whack it">${icon("hammer")}</button>
    </li>`;
  }

  // ----- arcade floor: a tidy grid of themed machines, Today's run alongside -----
  function renderHall() {
    const calm = lifeCalm(), ci = calmInfo(calm);
    const loose = state.moles.length;
    const overdue = state.moles.filter((m) => moleStatus(m) === "overdue").length;
    const hot = sortMoles(state.moles.filter(isHot));
    const weekAhead = addDays(dayKey(), 7);
    const soon = sortMoles(state.moles.filter((m) => !isHot(m) && m.due && m.due <= weekAhead));
    const rest = loose - hot.length - soon.length;
    const doneToday = doneOn(dayKey());
    const dateLong = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

    app.innerHTML = `
      <header class="hud-bar hall-bar">
        <a class="brand" href="#/" aria-label="Whack-a-Life home"><span class="brand-mark">${icon("hammer")}</span><span class="brand-text">Whack-a-Life</span></a>
        ${hudHTML()}
        <nav class="top-actions" aria-label="Options">
          ${syncBtn()}
          <button class="icon-btn" data-act="stats" aria-label="History" title="History">${icon("calendar")}</button>
          ${soundBtn()}
          <button class="icon-btn" data-act="export" aria-label="Download backup" title="Download backup">${icon("download")}</button>
          <button class="icon-btn" data-act="import" aria-label="Restore from backup" title="Restore from backup">${icon("upload")}</button>
        </nav>
      </header>

      <main class="hall" data-mob-tab="${hallTab}">
        <div class="mob-tabs" role="tablist" aria-label="View switcher">
          <button type="button" role="tab" class="mob-tab${hallTab === "floor" ? " on" : ""}" data-act="tab-floor" aria-selected="${hallTab === "floor"}">
            ${icon("layout-grid")}<span>Machines</span><b class="mob-badge${overdue ? " hot" : ""}">${loose}</b>
          </button>
          <button type="button" role="tab" class="mob-tab${hallTab === "today" ? " on" : ""}" data-act="tab-today" aria-selected="${hallTab === "today"}">
            ${icon("flame")}<span>Today's run</span><b class="mob-badge${hot.length ? " hot" : ""}">${hot.length + soon.length}</b>
          </button>
        </div>

        <aside class="today" aria-labelledby="today-title">
          <div class="panel today-panel">
            <div class="today-head">
              <div><h2 id="today-title">Today's run</h2><p>${dateLong}</p></div>
              <button class="btn btn-red sm" data-act="new-mole" title="New mole (N)">${icon("plus")}Mole</button>
            </div>
            <button class="list-cta" data-act="bulk" title="Write or paste several tasks at once (L)">
              <span class="list-cta-ic">${icon("notebook-pen")}</span>
              <span><b>Write a list</b><small>Type or paste tasks in Hebrew or English. They're translated and sorted for you.</small></span>
            </button>
            <p class="done-strip${doneToday ? " on" : ""}">${icon("check")}${doneToday ? `<b>${doneToday}</b> whacked today. Nice.` : "Nothing whacked yet today."}</p>

            <h3 class="list-h">${icon("flame")}Whack now <span class="count">${hot.length}</span></h3>
            ${hot.length ? `<ol class="run">${hot.map(runItem).join("")}</ol>`
              : `<p class="empty-msg">Nothing urgent or due today.${loose ? " Pick any machine and clear one." : ""}</p>`}

            ${soon.length ? `<h3 class="list-h soon">${icon("clock")}Coming up <span class="count">${soon.length}</span></h3><ol class="run">${soon.map(runItem).join("")}</ol>` : ""}
            ${rest > 0 ? `<p class="rest">+ ${plural(rest, "more mole")} with no deadline in the machines.</p>` : ""}
          </div>
        </aside>

        <section class="floor" aria-labelledby="floor-title">
          <div class="floor-head">
            <div>
              <h1 id="floor-title">Arcade floor</h1>
              <p class="sub">${plural(loose, "mole")} loose across ${plural(new Set(state.moles.map((m) => m.areaId)).size, "machine")}${overdue ? ` · <span class="warn">${overdue} overdue</span>` : ""}</p>
            </div>
            <div class="floor-head-actions">
              <div class="calm-card" title="Average calm across all machines">
                <span class="calm-ring" style="--p:${calm};--col:${ci.color}"><b>${calm}</b></span>
                <span><small>Life calm</small><b>${ci.label}</b></span>
              </div>
              <button type="button" class="btn btn-red sm mob-add" data-act="new-mole" title="New mole (N)">${icon("plus")}Mole</button>
            </div>
          </div>
          <div class="cabinets machines">
            ${sortedAreas().map((a, i) => machineCard(a, i)).join("")}
            ${playCard()}
            <button class="cab cab-new" data-act="new-machine">
              <span class="new-inner"><span class="new-plus">${icon("plus")}</span><b>Install a machine</b><small>Add a life area</small></span>
            </button>
          </div>
        </section>
      </main>`;
    fitMachines(app);
  }

  // A machine is drawn at its native size and scaled (CSS zoom) to fit its card,
  // standing on a small pedestal. Idle animations only play while you hover it.
  function machineArt(type, t, { name, pill = "", minis = [], artOpts = {} }) {
    const T = TYPES[type], w = T.win, sg = T.sign;
    const fs = Math.min(sg.h * 0.74, (sg.w - 10) / Math.max(4, name.length * 0.56));
    const holes = minis.length
      ? `<span class="mini-holes">${[0, 1, 2].map((k) => `<span class="mini-hole">${minis[k] ? `<span class="mini-mole u-${minis[k].u}">${moleSVG(minis[k].theme || t.id, minis[k].mood)}</span>` : ""}</span>`).join("")}</span>`
      : "";
    return `<span class="mstage${T.bob ? " floats" : ""}">
        <svg class="mped" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="mped-band" d="M3 15V25A97 13 0 0 0 197 25V15"/><ellipse class="mped-top" cx="100" cy="15" rx="97" ry="12"/></svg>
        <span class="mach-shadow"></span>
        <span class="mlift">
          <span class="mach-box" data-w="${T.w}" data-h="${T.h}" style="width:${T.w}px;height:${T.h}px">
            <span class="mach-move">
              <svg class="mach-art" viewBox="0 0 ${T.w} ${T.h}" width="${T.w}" height="${T.h}" aria-hidden="true" focusable="false">${T.art(t, artOpts)}</svg>
              <span class="cab-screen mach-win" style="left:${w.x}px;top:${w.y}px;width:${w.w}px;height:${w.h}px;border-radius:${w.r}">${sceneSVG(t.id)}${pill}${holes}</span>
              <span class="mach-sign" style="left:${sg.x}px;top:${sg.y}px;width:${sg.w}px;height:${sg.h}px;font-size:${fs.toFixed(1)}px">${esc(name)}</span>
            </span>
            ${T.front ? `<svg class="mach-front" viewBox="0 0 ${T.w} ${T.h}" width="${T.w}" height="${T.h}" aria-hidden="true" focusable="false">${T.front(t)}</svg>` : ""}
          </span>
        </span>
      </span>`;
  }

  function plaqueHTML({ ic, name, badge = "", meter = "", note = "", key = "" }) {
    return `<span class="mach-plaque">
        <span class="pl-row"><span class="pl-ic">${icon(ic)}</span><span class="pl-name">${esc(name)}</span>${badge}<span class="pl-go">${icon("chevron-right")}</span></span>
        <span class="pl-row pl-sub">${meter}<span class="pl-txt">${note}</span>${key !== "" ? `<kbd>${key}</kbd>` : ""}</span>
      </span>`;
  }

  function machineCard(a, idx, { preview = false } = {}) {
    const t = themeOf(a), type = typeFor(a);
    const moles = preview ? [{ urgency: "high" }, { urgency: "medium" }, { urgency: "low" }] : molesOf(a.id);
    const calm = preview ? 72 : areaCalm(a.id), ci = calmInfo(calm);
    const overdue = preview ? 0 : moles.filter((m) => moleStatus(m) === "overdue").length;
    const name = a.name || "New machine", n = moles.length;
    const badge = n ? `<b class="pl-n${overdue ? " hot" : ""}" title="${plural(n, "mole")} loose">${n}</b>` : `<span class="pl-ok" title="All clear">${icon("check")}</span>`;
    const inner = `
      ${overdue ? `<span class="mach-flag">${icon("zap")}${overdue} overdue</span>` : ""}
      ${machineArt(type, t, {
        name,
        pill: `<span class="screen-pill${n ? "" : " clear"}">${n ? `<b>${n}</b> loose` : `${icon("check")}All clear`}</span>`,
        minis: moles.slice(0, 3).map((m) => ({ u: m.urgency, mood: preview ? URG[m.urgency].mood : moodOf(m) })),
      })}
      ${plaqueHTML({
        ic: a.icon, name, badge,
        meter: `<span class="meter"><span style="width:${Math.max(calm, 4)}%;background:${ci.color}"></span></span>`,
        note: preview ? TYPES[type].label : ci.label,
        key: !preview && idx < 9 ? idx + 1 : "",
      })}`;
    if (preview) return `<div class="mcard preview mach-${type}" style="${themeVars(t)}">${inner}</div>`;
    return `<button class="mcard mach-${type}" data-id="${a.id}" style="${themeVars(t)}"
      aria-label="${esc(name)}: ${plural(n, "open task")}${overdue ? `, ${overdue} overdue` : ""}, ${ci.label.toLowerCase()}. Open machine.">${inner}</button>`;
  }

  function playCard() {
    const t = THEMES.arcade, best = state.settings.playBest;
    const themes = sortedAreas().map((a) => themeOf(a).id);
    return `<button class="mcard mach-whacktable mach-play" data-act="play" style="${themeVars(t)}" aria-label="Free Play: a just-for-fun whack-a-mole round with your finished tasks.${best ? ` Best ${best}.` : ""}">
      <span class="mach-flag fun">${icon("star")}Just for fun</span>
      ${machineArt("whacktable", t, {
        name: "Free Play",
        pill: `<span class="screen-pill">${best ? `Best <b>${best}</b>` : "Insert coin"}</span>`,
        artOpts: { moleThemes: [themes[8] || "murphy", themes[0] || "work", themes[2] || "apartment"] },
      })}
      ${plaqueHTML({
        ic: "gamepad-2", name: "Free Play",
        badge: best ? `<b class="pl-n pl-best" title="Best score">★ ${best}</b>` : "",
        note: plural(state.history.length, "old mole"), key: 0,
      })}
    </button>`;
  }

  function fitMachines(root = document) {
    for (const st of $$(".mstage", root)) {
      const box = $(".mach-box", st), sw = st.clientWidth, sh = st.clientHeight;
      if (!box || !sw || !sh) continue;
      const z = Math.min((sw * 0.94) / +box.dataset.w, (sh - 24) / +box.dataset.h);
      box.style.zoom = Math.max(0.15, z).toFixed(3);
    }
  }

  // ---------------- machine (task board) ----------------
  const holeBack = `<svg class="hole-back" viewBox="0 0 160 60" aria-hidden="true"><ellipse cx="80" cy="30" rx="76" ry="26" style="fill:var(--rim)" stroke="${INK}" stroke-width="3"/><ellipse cx="80" cy="31" rx="63" ry="18.5" fill="#2A2238"/><path d="M17 31A63 18.5 0 0 1 143 31A63 12 0 0 0 17 31Z" fill="#3E3456"/></svg>`;
  const holeFront = `<svg class="hole-front" viewBox="0 0 160 60" aria-hidden="true"><path d="M4 30A76 26 0 0 0 156 30L143 31A63 18.5 0 0 1 17 31Z" style="fill:var(--rim)"/><path d="M4 30A76 26 0 0 0 156 30" fill="none" stroke="${INK}" stroke-width="3"/><path d="M17 31A63 18.5 0 0 0 143 31" fill="none" stroke="${INK}" stroke-width="2.5"/><path d="M30 46A60 16 0 0 0 130 46" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/></svg>`;

  function holeHTML(m, t, i) {
    const st = moleStatus(m);
    const badge = st === "overdue" ? `<span class="badge over">Overdue</span>` : st === "today" ? `<span class="badge today">Today</span>`
      : st === "tomorrow" ? `<span class="badge">Tomorrow</span>` : st === "later" ? `<span class="badge">${fmtDate(m.due)}</span>` : "";
    return `<div class="hole" style="--i:${i}">
      <div class="hole-art">${badge}${holeBack}
        <div class="pit"><button class="mole u-${m.urgency}${st === "overdue" ? " overdue" : ""}${m.id === justAdded ? " pop" : ""}" data-whack="${m.id}"
          aria-label="Whack: ${esc(m.title)} (${URG[m.urgency].label}${dueText(m) ? ", " + dueText(m) : ""})">${moleSVG(t.id, moodOf(m))}</button></div>
        ${holeFront}
      </div>
      <button class="tag" data-edit="${m.id}" title="${esc(m.title)} (click to edit)"><span dir="auto">${esc(m.title)}</span>${icon("pencil", "tag-edit")}</button>
    </div>`;
  }
  const emptyHoleHTML = (i) => `<div class="hole empty" style="--i:${i}"><div class="hole-art">${holeBack}${holeFront}<button class="hole-add" data-add-here aria-label="Add a mole">${icon("plus")}</button></div></div>`;
  const urgencySeg = (name, checked = "medium") => URG_ORDER.map((u) =>
    `<label class="seg-opt"><input type="radio" name="${name}" value="${u}"${u === checked ? " checked" : ""} /><span><i class="dot u-${u}"></i>${URG[u].label}</span></label>`).join("");

  function gameHeader(t, title, sub, iconName, extra = "") {
    return `<header class="hud-bar">
      <a class="btn btn-white back" href="#/" aria-label="Back to the arcade floor">${icon("arrow-left")}<span>Arcade</span></a>
      <div class="plate"><span class="tile">${icon(iconName)}</span><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div></div>
      ${hudHTML()}
      <nav class="top-actions" aria-label="Options">${syncBtn()}${soundBtn()}${extra}</nav>
    </header>`;
  }

  function renderGame(a, { intro }) {
    const t = themeOf(a);
    const moles = molesOf(a.id);
    const calm = areaCalm(a.id), ci = calmInfo(calm);
    const today = dayKey();
    const todayCount = state.history.filter((h) => h.areaId === a.id && dayKey(h.whackedAt) === today).length;
    const recent = state.history.filter((h) => h.areaId === a.id).slice(0, 6);
    const cols = narrowMQ.matches ? 3 : 4;
    const holes = Math.max(cols * 2, Math.ceil((moles.length + 1) / cols) * cols);
    const draft = $("#qa-title")?.value || "";

    app.innerHTML = `
      <div class="game" style="${themeVars(t)}">
        ${gameHeader(t, a.name, t.name, a.icon, `<button class="icon-btn" data-act="machine-settings" aria-label="Machine settings" title="Machine settings">${icon("settings-2")}</button>`)}
        <section class="stage${intro ? " intro" : ""}" aria-label="${esc(a.name)} whack-a-mole board">
          <div class="stage-sky">${sceneSVG(t.id)}</div>
          <div class="stage-hud">
            <div class="chip-card"><small>Calm</small><span class="meter"><span style="width:${Math.max(calm, 4)}%;background:${ci.color}"></span></span><b>${ci.label}</b></div>
            <div class="chip-card"><small>Loose</small><b>${moles.length}</b></div>
            <div class="chip-card"><small>Whacked today</small><b>${todayCount}</b></div>
          </div>
          <div class="field">
            <div class="holes">${Array.from({ length: holes }, (_, i) => (moles[i] ? holeHTML(moles[i], t, i) : emptyHoleHTML(i))).join("")}</div>
          </div>
        </section>

        <form class="quick-add" id="quick-add" autocomplete="off">
          <label class="sr-only" for="qa-title">New mole for ${esc(a.name)}</label>
          <input id="qa-title" name="title" class="qa-input" placeholder="What popped up in ${esc(a.name)}?" maxlength="140" required value="${esc(draft)}" />
          <label class="sr-only" for="qa-due">Due date (optional)</label>
          <input type="date" id="qa-due" name="due" class="input qa-date" title="Due date (optional)" />
          <div class="seg" role="radiogroup" aria-label="Urgency">${urgencySeg("qa-urgency")}</div>
          <button class="btn btn-red" type="submit">${icon("plus")}Pop it</button>
          <button class="btn btn-white" type="button" data-act="bulk" title="Write or paste several tasks at once (L)">${icon("notebook-pen")}Write a list</button>
        </form>

        <section class="panels">
          <div class="panel">
            <div class="panel-head"><h2>Moles loose</h2><span class="count">${moles.length}</span></div>
            ${moles.length ? `<ul class="queue">${moles.map((m) => `
              <li class="q-row">
                <span class="dot u-${m.urgency}" title="${URG[m.urgency].label}"></span>
                <button class="q-title" data-edit="${m.id}" title="Edit" dir="auto">${esc(m.title)}</button>
                ${dueChip(m)}
                <button class="whack-btn" data-whack="${m.id}" aria-label="Whack: ${esc(m.title)}" title="Done, whack it">${icon("hammer")}</button>
              </li>`).join("")}</ul>` : `<p class="empty-msg">${icon("sparkles")}All clear on this machine.</p>`}
          </div>
          <div class="panel">
            <div class="panel-head"><h2>Recently whacked</h2></div>
            ${recent.length ? `<ul class="recent">${recent.map((h) => `
              <li>${icon("check", "r-ic")}<span class="r-title" dir="auto">${esc(h.title)}</span><span class="r-time">${new Date(h.whackedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span></li>`).join("")}</ul>`
              : `<p class="empty-msg">No whacks on this machine yet.</p>`}
          </div>
        </section>
      </div>`;
  }

  // ---------------- whack a real task ----------------
  function whack(id, evt) {
    const m = state.moles.find((x) => x.id === id);
    if (!m) return;
    const t = themeOf(areaById(m.areaId));
    const trigger = evt.target.closest("[data-whack]");
    const moleEl = $(`.mole[data-whack="${CSS.escape(id)}"]`);
    let target = trigger;
    if (moleEl) { const r = moleEl.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) target = moleEl; }
    let x = evt.clientX, y = evt.clientY;
    if (target !== trigger || !evt.detail) { const r = target.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 3; }

    swing(x, y); playWhack();
    if (moleEl) { moleEl.classList.add("whacked"); shakeStage(); }
    trigger.closest(".run-item, .q-row")?.classList.add("leaving");
    burst(x, y, t);

    const entry = { id: uid(), moleId: m.id, areaId: m.areaId, title: m.title, urgency: m.urgency, due: m.due, whackedAt: Date.now() };
    state.moles = state.moles.filter((x2) => x2.id !== id);
    state.history.unshift(entry);
    save();
    if (!state.moles.some((x2) => x2.areaId === m.areaId) && route.view === "game") setTimeout(() => banner("All clear!", areaById(m.areaId)?.name || ""), 350);
    setTimeout(render, moleEl ? 480 : 300);
    showUndo(m, entry);
  }

  function shakeStage() {
    const stage = $(".stage");
    if (!stage) return;
    stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
  }
  const STAR = `<svg viewBox="0 0 24 24"><path d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5L7 14l-5.3-5 7.2-.9z" fill="currentColor" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  function fxAdd(cls, style, html = "", ms = 1000) {
    const el = document.createElement("div");
    el.className = cls; el.style.cssText = style; el.innerHTML = html;
    $("#fx").appendChild(el); setTimeout(() => el.remove(), ms);
  }
  function burst(x, y, t, word = pick(WORDS)) {
    const pos = `left:${x}px;top:${y}px;--fx-c:${t.primary};--fx-c2:${t.secondary};`;
    fxAdd("fx-ring", pos);
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.4, dist = 64 + Math.random() * 46;
      fxAdd("fx-star", `${pos}--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist}px;color:${[t.primary, t.secondary, "#FFC93C"][i % 3]}`, STAR);
    }
    fxAdd("fx-text", pos, word);
  }
  function banner(title, sub) {
    playFanfare();
    fxAdd("fx-banner", "", `${sub ? `<small>${esc(sub)}</small>` : ""}<b>${esc(title)}</b>`, 2200);
    confetti();
  }
  function confetti() {
    for (let i = 0; i < 24; i++) {
      const x = innerWidth / 2 + (Math.random() - 0.5) * 520, y = innerHeight * 0.36;
      fxAdd("fx-star big", `left:${x}px;top:${y}px;--dx:${(Math.random() - 0.5) * 260}px;--dy:${120 + Math.random() * 220}px;color:${["#FFC93C", "#FF6F91", "#4EA8F5", "#2FCB7A"][i % 4]}`, STAR, 1400);
    }
  }

  function showUndo(mole, entry) {
    const toast = $("#toast");
    toast.innerHTML = `<span class="toast-ic">${icon("hammer")}</span><span class="toast-msg">Whacked <b>${esc(mole.title)}</b></span><button class="btn btn-white sm">${icon("undo-2")}Undo</button>`;
    toast.hidden = false;
    $("button", toast).onclick = () => {
      state.history = state.history.filter((h) => h.id !== entry.id);
      state.deletedIds[entry.id] = Date.now();
      mole.updatedAt = Date.now();
      if (areaById(mole.areaId)) state.moles.push(mole);
      justAdded = mole.id;
      save(); render(); toast.hidden = true;
    };
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => (toast.hidden = true), 6000);
  }

  // ---------------- Free Play ----------------
  let play = null;

  function renderPlay() {
    const t = THEMES.arcade;
    const slots = narrowMQ.matches ? 9 : 12;
    app.innerHTML = `
      <div class="game play" style="${themeVars(t)}">
        ${gameHeader(t, "Free Play", "Just for fun · old to-dos", "gamepad-2")}
        <section class="stage play-stage" aria-label="Free Play whack-a-mole">
          <div class="stage-sky">${sceneSVG(t.id)}</div>
          <div class="stage-hud">
            <div class="chip-card"><small>Whacked</small><b id="pl-score">0</b></div>
            <div class="chip-card pl-timer"><small>Time</small><span class="meter"><span id="pl-bar" style="width:100%;background:var(--green)"></span></span><b id="pl-secs">${PLAY_SECONDS}</b></div>
            <div class="chip-card"><small>Best</small><b id="pl-best">${state.settings.playBest}</b></div>
          </div>
          <div class="field">
            <div class="holes">${Array.from({ length: slots }, (_, i) => `
              <div class="hole" data-slot="${i}"><div class="hole-art">${holeBack}<div class="pit"></div>${holeFront}</div><span class="tag play-tag" hidden><span dir="auto"></span></span></div>`).join("")}</div>
          </div>
          <div class="play-overlay" id="pl-overlay">${playIntroCard()}</div>
        </section>
        <p class="play-note">${icon("sparkles")}Free Play only uses tasks you've already finished. Nothing here changes your list.</p>
      </div>`;
    $("#pl-start")?.focus();
  }

  function playPool() {
    const seen = new Set(), pool = [];
    for (const h of state.history) {
      const key = h.title.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push({ title: h.title, theme: themeOf(areaById(h.areaId)).id });
    }
    return pool;
  }

  function playIntroCard() {
    const n = playPool().length;
    return `<div class="play-card">
      <span class="tile lg">${icon("gamepad-2")}</span>
      <h2>Free Play</h2>
      <p>${PLAY_SECONDS} seconds. Whack as many moles as you can.<br>${n ? `Starring ${plural(n, "task")} you already finished.` : "No finished tasks yet, so these are practice moles."}</p>
      <button class="btn btn-red btn-lg" id="pl-start" data-act="play-start">${icon("hammer")}Start</button>
    </div>`;
  }

  function startPlay() {
    const overlay = $("#pl-overlay");
    if (!overlay) return;
    const pool = playPool();
    play = { pool: pool.length ? pool : PRACTICE.map((title) => ({ title, theme: pick(Object.keys(THEMES)) })), score: 0, active: new Map(), timers: [], running: false };
    let n = 3;
    const step = () => {
      if (!play) return;
      if (n > 0) { overlay.innerHTML = `<div class="countdown" aria-live="assertive">${n}</div>`; playBlip(false); n--; play.timers.push(setTimeout(step, 600)); }
      else { overlay.innerHTML = `<div class="countdown go">Go!</div>`; playBlip(true); play.timers.push(setTimeout(() => { overlay.hidden = true; runPlay(); }, 450)); }
    };
    step();
  }

  function runPlay() {
    if (!play) return;
    play.running = true;
    play.start = performance.now();
    play.nextSpawn = 0;
    play.loop = setInterval(playTick, 50);
  }

  function playTick() {
    if (!play?.running) return;
    const now = performance.now();
    const elapsed = (now - play.start) / 1000, p = Math.min(1, elapsed / PLAY_SECONDS);
    const left = Math.max(0, PLAY_SECONDS - elapsed);
    const bar = $("#pl-bar");
    if (bar) { bar.style.width = `${(1 - p) * 100}%`; bar.style.background = left < 5 ? "var(--red)" : left < 12 ? "var(--yellow)" : "var(--green)"; }
    const secs = $("#pl-secs"); if (secs) secs.textContent = Math.ceil(left);
    if (left <= 0) return endPlay();
    const maxActive = 2 + Math.floor(p * 3);
    if (now >= play.nextSpawn && play.active.size < maxActive) {
      spawnPlayMole(1500 - 750 * p);
      play.nextSpawn = now + (900 - 480 * p) * (0.7 + Math.random() * 0.6);
    }
  }

  function spawnPlayMole(stay) {
    const free = $$(".play-stage .hole").filter((h) => !play.active.has(h.dataset.slot));
    if (!free.length) return;
    const hole = pick(free), slot = hole.dataset.slot;
    const item = pick(play.pool);
    const r = Math.random(), mood = r < 0.2 ? "angry" : r < 0.35 ? "sleepy" : "normal";
    const u = mood === "angry" ? "high" : mood === "sleepy" ? "low" : "medium";
    const pit = $(".pit", hole);
    pit.innerHTML = `<button class="mole u-${u} pop" data-pl="${slot}" aria-label="Whack: ${esc(item.title)}">${moleSVG(item.theme, mood)}</button>`;
    const tag = $(".play-tag", hole);
    tag.firstElementChild.textContent = item.title; tag.hidden = false;
    const timer = setTimeout(() => hidePlayMole(slot, false), stay);
    play.active.set(slot, { timer, theme: item.theme });
  }

  function hidePlayMole(slot, whacked) {
    if (!play) return;
    const rec = play.active.get(slot);
    if (!rec) return;
    clearTimeout(rec.timer);
    const hole = $(`.play-stage .hole[data-slot="${slot}"]`);
    const mole = hole && $(".mole", hole);
    if (mole) mole.classList.add(whacked ? "whacked" : "retreat");
    setTimeout(() => {
      if (hole) { $(".pit", hole).innerHTML = ""; $(".play-tag", hole).hidden = true; }
      play?.active.delete(slot);
    }, whacked ? 420 : 260);
  }

  function whackPlay(slot, evt) {
    if (!play?.running) return;
    const rec = play.active.get(slot), mole = evt.target.closest(".mole");
    if (!rec || !mole || mole.classList.contains("whacked") || mole.classList.contains("retreat")) return;
    const r = mole.getBoundingClientRect();
    const x = evt.detail ? evt.clientX : r.left + r.width / 2, y = evt.detail ? evt.clientY : r.top + r.height / 3;
    swing(x, y); playWhack(); shakeStage();
    play.score++;
    const s = $("#pl-score"); if (s) s.textContent = play.score;
    burst(x, y, THEMES[rec.theme] || THEMES.arcade, pick(WORDS));
    hidePlayMole(slot, true);
  }

  function endPlay() {
    if (!play) return;
    clearInterval(play.loop);
    play.running = false;
    for (const slot of [...play.active.keys()]) hidePlayMole(slot, false);
    const score = play.score, prevBest = state.settings.playBest, isBest = score > prevBest;
    if (isBest) { state.settings.playBest = score; save(); }
    const overlay = $("#pl-overlay");
    if (overlay) {
      overlay.hidden = false;
      overlay.innerHTML = `<div class="play-card">
        <p class="eyebrow">Time's up</p>
        <div class="big-score">${score}</div>
        <p>${score === 1 ? "mole whacked" : "moles whacked"}${isBest && prevBest ? `. <b>New best!</b> (old best: ${prevBest})` : isBest && score ? ". <b>First record set!</b>" : ` · Best: ${state.settings.playBest}`}</p>
        <div class="play-actions"><a class="btn btn-white" href="#/">${icon("arrow-left")}Arcade</a><button class="btn btn-red btn-lg" id="pl-start" data-act="play-start">${icon("undo-2")}Play again</button></div>
      </div>`;
      $("#pl-start")?.focus();
    }
    const best = $("#pl-best"); if (best) best.textContent = state.settings.playBest;
    hammer.classList.remove("show");
    playFanfare();
    if (isBest && score) confetti();
    play = null;
  }

  function stopPlay() {
    if (!play) return;
    clearInterval(play.loop);
    play.timers.forEach(clearTimeout);
    play.active.forEach((r) => clearTimeout(r.timer));
    play = null;
  }

  // ---------------- hammer cursor (mouse & touch) ----------------
  const hammer = $("#hammer");
  let touchHammerTimer = null;
  function swing(x, y) {
    if (!finePointer && typeof x === "number" && typeof y === "number") {
      hammer.style.transform = `translate3d(${x - 24}px, ${y - 62}px, 0)`;
      hammer.classList.add("show");
      clearTimeout(touchHammerTimer);
      touchHammerTimer = setTimeout(() => hammer.classList.remove("show"), 360);
    }
    hammer.classList.add("swing");
    setTimeout(() => hammer.classList.remove("swing"), 120);
  }
  if (finePointer) {
    document.addEventListener("pointermove", (e) => {
      const inField = !!e.target.closest?.(".field") && !$("dialog[open]");
      hammer.classList.toggle("show", inField);
      if (inField) hammer.style.transform = `translate3d(${e.clientX + 3}px, ${e.clientY - 50}px, 0)`;
    }, { passive: true });
    document.addEventListener("pointerdown", (e) => { if (e.target.closest?.(".field")) swing(); });
  }

  // ---------------- events ----------------
  app.addEventListener("click", (e) => {
    const plMole = e.target.closest("[data-pl]");
    if (plMole) return whackPlay(plMole.dataset.pl, e);
    const el = e.target.closest("[data-act],[data-whack],[data-edit],[data-open],[data-add-here],.mcard[data-id]");
    if (!el || el.disabled) return;
    if (el.dataset.whack) return whack(el.dataset.whack, e);
    if (el.dataset.edit) return openMoleDialog(state.moles.find((m) => m.id === el.dataset.edit));
    if (el.dataset.open) return enter(el.dataset.open);
    if (el.hasAttribute("data-add-here")) return $("#qa-title")?.focus();
    if (el.dataset.id) return enter(el.dataset.id);
    switch (el.dataset.act) {
      case "sync": return openSyncDialog();
      case "tab-floor": hallTab = "floor"; renderHall(); return;
      case "tab-today": hallTab = "today"; renderHall(); return;
      case "stats": return openStats();
      case "mute": state.settings.muted = !state.settings.muted; save(); return route.view === "play" ? updateMuteBtn() : render();
      case "export": return exportData();
      case "import": return $("#import-file").click();
      case "new-machine": return openMachineDialog();
      case "new-mole": return openMoleDialog();
      case "bulk": return openBulk();
      case "machine-settings": return openMachineDialog(areaById(route.id));
      case "play": return enterPlay();
      case "play-start": playCoin(); return startPlay();
    }
  });
  function updateMuteBtn() {
    const b = $('[data-act="mute"]');
    if (b) b.outerHTML = soundBtn();
  }

  app.addEventListener("submit", (e) => {
    if (e.target.id !== "quick-add") return;
    e.preventDefault();
    const f = e.target.elements;
    const title = f.title.value.trim();
    if (!title) return;
    const now = Date.now();
    const m = { id: uid(), createdAt: now, updatedAt: now, areaId: route.id, title, due: f.due.value || null, urgency: f["qa-urgency"].value || "medium" };
    state.moles.push(m);
    justAdded = m.id;
    f.title.value = "";
    save(); playPop(); render();
    $("#qa-title")?.focus();
  });

  // ---------------- dialogs ----------------
  $$("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); }));

  function confirmBox({ title, body, ok = "Delete", danger = true }) {
    return new Promise((resolve) => {
      const d = document.createElement("dialog");
      d.className = "sheet confirm";
      d.innerHTML = `<h2>${esc(title)}</h2><p>${esc(body)}</p>
        <footer class="sheet-foot"><span class="spacer"></span><button class="btn btn-white" value="no">Cancel</button><button class="btn ${danger ? "btn-red" : "btn-green"}" value="ok">${esc(ok)}</button></footer>`;
      d.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) d.close(b.value); else if (e.target === d) d.close("no"); });
      d.addEventListener("close", () => { resolve(d.returnValue === "ok"); d.remove(); });
      document.body.appendChild(d);
      d.showModal();
      $(".btn-white", d).focus();
    });
  }

  // mole dialog
  // ----- paste a list (bulk add with auto-sorting) -----
  // strong words point clearly at one machine; weak ones (buy, fix, clean) only break ties
  const KEYWORDS = {
    work: { strong: ["work", "office", "team", "boss", "manager", "meeting", "colleague", "leetcode", "interview", "job", "client", "deadline", "עבודה", "משרד", "צוות", "מנהל", "פגישה", "ישיבה", "ראיון", "לקוח", "דדליין", "ליטקוד", "לידקוד"] },
    mba: { strong: ["mba", "course", "class", "semester", "exam", "lecture", "homework", "assignment", "degree", "professor", "study", "studies", "group project", "attendance", "university", "לימודים", "קורס", "סמסטר", "מבחן", "בחינה", "הרצאה", "תואר", "שיעורי בית", "מטלה", "מרצה", "נוכחות", "חלוקה לקבוצות", "ללמוד"] },
    apartment: { strong: ["apartment", "flat", "landlord", "lease", "couch", "sofa", "mattress", "rats", "kitchen", "bathroom", "laundry", "dishes", "plumber", "electrician", "דירה", "בעל דירה", "בעל הבית", "חוזה", "ספה", "מזרן", "חולד", "מטבח", "אמבטיה", "כביסה", "כלים", "אינסטלטור", "חשמלאי", "לתלות", "מקרר"], weak: ["clean", "home", "house", "לנקות", "ניקיון", "בית"] },
    money: { strong: ["money", "pay", "bank", "budget", "bill", "invoice", "charge", "fine", "ticket", "tax", "municipality", "city hall", "appeal", "electricity", "rent", "savings", "save", "refund", "salary", "insurance", "buyme", "כסף", "לשלם", "תשלום", "בנק", "תקציב", "חשבון", "חשבונית", "חיוב", "דוח", "קנס", "מס", "חיסכון", "החזר", "משכורת", "ביטוח", "עירייה", "ערעור"] },
    travel: { strong: ["נסיעות", "trip", "flight", "vacation", "holiday", "hotel", "travel", "passport", "airbnb", "booking", "טיסה", "חופשה", "טיול", "מלון", "נסיעה", "דרכון", "צימר"] },
    health: { strong: ["doctor", "dentist", "tooth", "teeth", "health", "physio", "therapy", "medicine", "pharmacy", "blood test", "gastro", "orthopedi", "dermatolog", "shoulder", "colitis", "skin", "רופא", "רופאת", "שיניים", "שן", "בריאות", "קוליטיס", "גסטרו", "אורטופד", "עור", "תרופה", "מרשם", "בדיקת דם", "פיזיותרפיה"], weak: ["appointment", "תור"] },
    fitness: { strong: ["fitness", "gym", "workout", "work out", "weight", "kg", "kilo", "body", "muscle", "cardio", "run", "running", "protein", "creatine", "diet", "calories", "cut", "bulk", "lifting", "barbell", "kettlebell", "pushup", "pullup", "abs", "אימון", "כושר", "משקל", "קילו", "ק״ג", "ק\"ג", "חדר כושר", "מכון", "גוף", "שריר", "ריצה", "חלבון", "דיאטה", "חיטוב", "מסה", "לרדת במשקל"] },
    errands: { strong: ["errand", "errands", "סידורים", "סידור", "post office", "mail", "parcel", "package", "pickup", "pick up", "return", "drop off", "dry cleaning", "key", "duplicate", "cobbler", "tailor", "print", "form", "renew", "queue", "דואר", "חבילה", "לאסוף", "איסוף", "החזרה", "להחזיר", "ניקוי יבש", "מפתח", "שכפול", "לשכפל", "סנדלר", "תופרת", "סוללות", "להדפיס", "טופס", "בירוקרטיה"] },
    family: { strong: ["family", "mom", "dad", "mother", "father", "grandma", "grandpa", "brother", "sister", "wedding", "birthday", "grandmother", "grandfather", "parents", "nephew", "niece", "משפחה", "אמא", "אבא", "סבתא", "סבא", "אח ", "אחות", "חתונה", "יום הולדת", "אחיין", "אחיינית", "הורים"] },
    possessions: { strong: ["equipment", "gear", "ציוד", "רכוש", "tv", "iphone", "phone", "laptop", "bike", "sneakers", "shoes", "pots", "shower head", "tami4", "headphones", "furniture", "טלוויזיה", "אייפון", "טלפון", "מחשב", "אופניים", "סניקרס", "נעליים", "סירים", "דוש", "תמי", "אוזניות", "רהיט"], weak: ["buy", "order", "fix", "repair", "new", "replace", "לקנות", "להזמין", "לתקן", "חדש", "להחליף"] },
    murphy: { strong: ["murphy", "dog", "vet", "dog food", "treats", "snacks", "leash", "walk the dog", "מרפי", "כלב", "וטרינר", "אוכל לכלב", "חטיפים", "רצועה", "טיול עם"] },
  };
  const urgentRe = /\b(urgent|asap|today|!!)\b|דחוף|היום/i;

  function areaKeywords(a) {
    const key = norm(a.name) === "appartement" ? "apartment" : norm(a.name);
    return KEYWORDS[key] || { strong: [] };
  }
  function guessArea(text) {
    const t = " " + norm(text) + " ";
    let best = null, bestScore = 0;
    for (const a of sortedAreas()) {
      const kw = areaKeywords(a);
      let score = t.includes(norm(a.name)) ? 3 : 0;
      for (const w of kw.strong) if (t.includes(w)) score += 2;
      for (const w of kw.weak || []) if (t.includes(w)) score += 1;
      if (score > bestScore) { best = a; bestScore = score; }
    }
    return best;
  }
  function parseBulk(text) {
    const rows = [];
    let section = null;
    for (const raw of text.split(/\r?\n/)) {
      let line = raw.replace(/[*_#`]+/g, " ").trim();
      if (!line) { section = null; continue; }
      const done = /[✅✔☑]|\[x\]/i.test(line);
      line = line.replace(/[✅✔☑]/g, "").replace(/^\s*(?:[-–—•·>]+|\d+[.)]|\[[ x]?\])\s*/i, "").replace(/\s*[-–—]+\s*$/, "").replace(/\s+/g, " ").trim();
      if (!line) continue;
      if (/[:：]$/.test(line)) { section = guessArea(line.slice(0, -1)); continue; }
      rows.push({ orig: line.slice(0, 140), done, urgency: urgentRe.test(line) ? "high" : "medium", sectionId: section?.id || null });
    }
    return rows;
  }

  // ----- translation: on-device (Chrome Translator API) first, online (MyMemory) fallback -----
  const HEB = /[\u0590-\u05FF]/;
  const tCache = new Map();
  let chromeTr = null, chromeTrState = "idle", trVia = null;
  const KEEP_CASE = new Set(["murphy", "max", "anthropic", "buyme", "ein", "gedi", "leetcode", "tami4", "iphone", "tv", "mba", "claude", "israel", "tel", "aviv"]);
  function tidy(t) {
    t = t.replace(/\s+/g, " ").replace(/[.。]+$/, "").trim();
    const words = t.split(" ");
    const titleCased = words.length > 1 && words.filter((w) => /^[A-Z][a-z]/.test(w)).length >= Math.ceil(words.length * 0.6);
    if (titleCased) t = words.map((w, i) => (i && /^[A-Z][a-z]+$/.test(w) && !KEEP_CASE.has(w.toLowerCase()) ? w.toLowerCase() : w)).join(" ");
    t = t.replace(/\bmurphy\b/gi, "Murphy")
      .replace(/^(?:i['’]m gonna|i['’]m going to|i will|i['’]ll|i need to|need to|let['’]s|to)\s+(?:go\s+)?/i, "")
      .replace(/^(?:make|schedule|set|set up) an? appointment (?:with|for|at)\s+(?:an?|the)\s+/i, "Book ")
      .replace(/^(?:make|schedule|set|set up) an? appointment/i, "Book an appointment")
      .replace(/\s+the municipality\b/i, " the city");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function chromeTranslator() {
    if (chromeTrState !== "idle" || !("Translator" in self)) return;
    chromeTrState = "loading";
    (async () => {
      try {
        const av = await Translator.availability({ sourceLanguage: "he", targetLanguage: "en" });
        if (av === "unavailable") throw new Error("unavailable");
        chromeTr = await Translator.create({
          sourceLanguage: "he", targetLanguage: "en",
          monitor(m) { m.addEventListener("downloadprogress", (e) => setBulkStatus(`Downloading the Hebrew→English translator… ${Math.round(e.loaded * 100)}%`)); },
        });
        chromeTrState = "ready";
      } catch { chromeTrState = "failed"; }
    })();
  }
  async function translateOne(text) {
    if (chromeTrState === "ready") {
      try { return { text: await chromeTr.translate(text), via: "device" }; } catch {}
    }
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=he|en`);
    const j = await r.json();
    const out = j?.responseData?.translatedText;
    if (!out || j.quotaFinished || /MYMEMORY WARNING|INVALID/i.test(out)) throw new Error("translation unavailable");
    return { text: out, via: "online" };
  }
  let trTimer = null, trBusy = false, trNeedsRender = false;
  function scheduleTranslate() {
    clearTimeout(trTimer);
    trTimer = setTimeout(runTranslate, 450);
  }
  async function runTranslate() {
    if (trBusy) return scheduleTranslate();
    const todo = [...new Set(bulkRows.filter((r) => r.translating).map((r) => r.orig))].filter((o) => !tCache.has(o));
    if (!todo.length) return;
    trBusy = true;
    chromeTranslator();
    if (chromeTrState === "loading") await Promise.race([new Promise((res) => { const iv = setInterval(() => { if (chromeTrState !== "loading") { clearInterval(iv); res(); } }, 100); }), new Promise((res) => setTimeout(res, 6000))]);
    setBulkStatus(`Translating ${plural(todo.length, "line")}…`);
    let failed = 0;
    for (const o of todo) {
      try { const res = await translateOne(o); tCache.set(o, { text: tidy(res.text), via: res.via }); trVia = res.via; }
      catch { tCache.set(o, { text: null, via: "failed" }); failed++; }
    }
    trBusy = false;
    setBulkStatus(failed ? `Couldn't translate ${plural(failed, "line")} (offline?), so they're kept as written. You can edit them below.` : "");
    if (bulkDialog.open) {
      if (bulkPreview.contains(document.activeElement)) trNeedsRender = true; else renderBulk();
    }
  }
  function setBulkStatus(msg) {
    const el = $("#bulk-status");
    if (!el) return;
    const base = !$("#bulk-translate").checked ? "" : trVia === "device" ? "Translated on this device" : trVia === "online" ? "Translated online (MyMemory)" : "";
    el.textContent = msg || base;
  }

  const bulkDialog = $("#bulk-dialog"), bulkText = $("#bulk-text"), bulkPreview = $("#bulk-preview");
  let bulkRows = [], bulkOverrides = new Map();
  const fallbackArea = () => (route.view === "game" && areaById(route.id)) || areaById(lastAreaId) || state.areas.find((a) => norm(a.name) === "errands") || sortedAreas()[0];

  function openBulk() {
    if (!state.areas.length) return openMachineDialog();
    bulkText.value = "";
    bulkOverrides = new Map();
    $("#bulk-translate").checked = state.settings.translate !== false;
    renderBulk();
    setBulkStatus("");
    bulkDialog.showModal();
    bulkText.focus();
  }
  function renderBulk() {
    trNeedsRender = false;
    const translateOn = $("#bulk-translate").checked;
    const open = new Set(state.moles.map((m) => norm(m.title)));
    bulkRows = parseBulk(bulkText.value).map((r) => {
      const o = bulkOverrides.get(norm(r.orig)) || {};
      let title = r.orig, translating = false, failed = false;
      if (translateOn && HEB.test(r.orig)) {
        const c = tCache.get(r.orig);
        if (!c) translating = true;
        else if (c.text) title = c.text;
        else failed = true;
      }
      if (o.title) title = o.title;
      const guess = guessArea(`${r.orig} ${title}`);
      const areaId = o.areaId || r.sectionId || guess?.id || fallbackArea().id;
      const dup = !r.done && (open.has(norm(title)) || open.has(norm(r.orig)));
      return { ...r, title, translating, failed, areaId, guessed: !!(o.areaId || r.sectionId || guess), done: o.done ?? r.done, include: o.include ?? !dup, dup };
    });
    const opts = (sel) => sortedAreas().map((a) => `<option value="${a.id}"${a.id === sel ? " selected" : ""}>${esc(a.name)}</option>`).join("");
    bulkPreview.innerHTML = bulkRows.map((r, i) => {
      const note = r.translating ? `<small class="b-note wait">Translating…</small>`
        : r.dup ? `<small class="b-note warn">Already on your list</small>`
        : !r.guessed ? `<small class="b-note warn">Not sure where this goes, so pick a machine</small>`
        : r.title !== r.orig ? `<small class="b-note" dir="auto">${esc(r.orig)}</small>` : "";
      return `
      <li class="b-row${r.include ? "" : " off"}${r.translating ? " busy" : ""}" style="${themeVars(themeOf(areaById(r.areaId)))}">
        <label class="b-check" title="Include"><input type="checkbox" data-i="${i}" data-k="include"${r.include ? " checked" : ""} aria-label="Include this task" /></label>
        <span class="b-title"><input class="b-input" data-i="${i}" data-k="title" value="${esc(r.title)}" dir="auto" maxlength="140" aria-label="Task name" />${note}</span>
        <label class="b-done"><input type="checkbox" data-i="${i}" data-k="done"${r.done ? " checked" : ""} />Done</label>
        <span class="b-area"><span class="tile xs">${icon(areaById(r.areaId).icon)}</span><select class="input" data-i="${i}" data-k="areaId" aria-label="Machine">${opts(r.areaId)}</select></span>
      </li>`;
    }).join("");
    const inc = bulkRows.filter((r) => r.include), nd = inc.filter((r) => r.done).length, nm = inc.length - nd;
    const waiting = bulkRows.some((r) => r.translating);
    $("#bulk-count").textContent = inc.length ? [nm && plural(nm, "new mole"), nd && `${nd} done`].filter(Boolean).join(" · ") : bulkRows.length ? "Nothing selected" : "";
    $("#bulk-save").disabled = !inc.length || waiting;
    $("#bulk-save").innerHTML = waiting ? "Translating…" : `${icon("plus")}Add${inc.length ? ` ${inc.length}` : ""}`;
    if (waiting) scheduleTranslate();
  }
  bulkText.addEventListener("input", renderBulk);
  $("#bulk-translate").addEventListener("change", (e) => { state.settings.translate = e.target.checked; save(); renderBulk(); setBulkStatus(""); });
  bulkPreview.addEventListener("change", (e) => {
    const el = e.target, r = bulkRows[el.dataset.i];
    if (!r) return;
    const o = bulkOverrides.get(norm(r.orig)) || {};
    o[el.dataset.k] = el.type === "checkbox" ? el.checked : el.value.trim() || undefined;
    bulkOverrides.set(norm(r.orig), o);
    renderBulk();
  });
  bulkPreview.addEventListener("focusout", () => setTimeout(() => { if (trNeedsRender && !bulkPreview.contains(document.activeElement)) renderBulk(); }, 0));
  bulkPreview.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches(".b-input")) { e.preventDefault(); e.target.blur(); } });
  $("#bulk-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inc = bulkRows.filter((r) => r.include && !r.translating);
    if (!inc.length) return;
    let t = Date.now(), added = 0, done = 0;
    for (const r of inc) {
      const title = r.title.trim().slice(0, 140) || r.orig;
      if (r.done) { const id = uid(); state.history.unshift({ id, moleId: id, areaId: r.areaId, title, urgency: r.urgency, due: null, whackedAt: t++ }); done++; }
      else { const ts = t++; const m = { id: uid(), createdAt: ts, updatedAt: ts, areaId: r.areaId, title, due: null, urgency: r.urgency }; state.moles.push(m); justAdded = m.id; added++; }
    }
    state.history.sort((a, b) => b.whackedAt - a.whackedAt);
    lastAreaId = inc[inc.length - 1].areaId;
    bulkDialog.close();
    save(); playPop(); render();
    const machines = new Set(inc.map((r) => r.areaId)).size;
    notify([added && `Added <b>${added}</b> ${added === 1 ? "mole" : "moles"}`, done && `logged <b>${done}</b> done`].filter(Boolean).join(", ") + ` across ${plural(machines, "machine")}.`);
  });

  const moleDialog = $("#mole-dialog"), moleForm = $("#mole-form");
  let editingMole = null;
  $("[data-urgency-seg]").innerHTML = urgencySeg("urgency");

  function openMoleDialog(m) {
    if (!state.areas.length) return openMachineDialog();
    editingMole = m?.id || null;
    const areas = sortedAreas(), f = moleForm.elements;
    f.areaId.innerHTML = areas.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("");
    f.areaId.value = m?.areaId || (route.view === "game" ? route.id : lastAreaId) || areas[0].id;
    f.title.value = m?.title || "";
    f.due.value = m?.due || "";
    f.urgency.value = m?.urgency || "medium";
    $("#mole-dialog-title").textContent = editingMole ? "Edit mole" : "New mole";
    $("#mole-save").innerHTML = editingMole ? "Save" : `${icon("plus")}Pop it`;
    $("#mole-delete").hidden = !editingMole;
    moleDialog.showModal();
    f.title.focus();
  }
  moleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = moleForm.elements;
    const now = Date.now();
    const data = { title: f.title.value.trim(), areaId: f.areaId.value, due: f.due.value || null, urgency: f.urgency.value || "medium", updatedAt: now };
    if (!data.title) return;
    lastAreaId = data.areaId;
    if (editingMole) Object.assign(state.moles.find((m) => m.id === editingMole), data);
    else { const m = { id: uid(), createdAt: now, ...data }; state.moles.push(m); justAdded = m.id; playPop(); }
    moleDialog.close();
    save(); render();
  });
  $("#mole-delete").addEventListener("click", async () => {
    const m = state.moles.find((x) => x.id === editingMole);
    if (!m) return;
    moleDialog.close();
    if (!(await confirmBox({ title: "Delete this mole?", body: `"${m.title}" will be removed from your list without counting as done.` }))) return;
    state.deletedIds[m.id] = Date.now();
    state.moles = state.moles.filter((x) => x.id !== m.id);
    save(); render();
  });

  // machine dialog
  const machineDialog = $("#machine-dialog"), machineForm = $("#machine-form");
  let editingArea = null;
  function updateMachinePreview() {
    const f = machineForm.elements;
    const fake = { id: "preview", name: f.name.value.trim() || "New machine", theme: f.theme.value, icon: f.icon.value, machine: f.machine.value };
    const box = $("#machine-preview");
    box.innerHTML = machineCard(fake, 0, { preview: true });
    fitMachines(box);
  }
  function openMachineDialog(area) {
    editingArea = area?.id || null;
    const used = new Set(state.areas.map((a) => a.theme));
    const theme = area?.theme || Object.keys(THEMES).find((k) => !used.has(k)) || "arcade";
    $("#machine-dialog-title").textContent = area ? "Machine settings" : "Install a machine";
    $("#machine-save").textContent = area ? "Save" : "Install";
    $("#machine-extra").hidden = !area;
    $("#theme-picker").innerHTML = Object.values(THEMES).map((t) => `
      <label class="theme-opt" style="${themeVars(t)}"><input type="radio" name="theme" value="${t.id}"${t.id === theme ? " checked" : ""} />
        <span><i class="sw-sun"></i><i class="sw-ground"></i><b>${t.name}</b></span></label>`).join("");
    $("#icon-picker").innerHTML = AREA_ICONS.map((n) => `
      <label class="icon-opt" title="${n.replace(/-/g, " ")}"><input type="radio" name="icon" value="${n}" aria-label="${n.replace(/-/g, " ")}"${n === (area?.icon || "star") ? " checked" : ""} /><span>${icon(n)}</span></label>`).join("");
    const curType = area ? typeFor(area) : PICKABLE.find((k) => !state.areas.some((a) => typeFor(a) === k)) || "upright";
    $("#type-picker").innerHTML = PICKABLE.map((k) => `<label class="type-opt"><input type="radio" name="machine" value="${k}"${k === curType ? " checked" : ""} /><span>${TYPES[k].label}</span></label>`).join("");
    machineForm.elements.name.value = area?.name || "";
    updateMachinePreview();
    machineDialog.showModal();
    fitMachines($("#machine-preview"));
    machineForm.elements.name.focus();
  }
  machineForm.addEventListener("input", updateMachinePreview);
  machineForm.addEventListener("change", updateMachinePreview);
  machineForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = machineForm.elements, name = f.name.value.trim();
    if (!name) return;
    const now = Date.now();
    if (editingArea) Object.assign(areaById(editingArea), { name, theme: f.theme.value, icon: f.icon.value, machine: f.machine.value, updatedAt: now });
    else state.areas.push({ id: uid(), name, theme: f.theme.value, icon: f.icon.value, machine: f.machine.value, updatedAt: now, order: state.areas.length ? Math.max(...state.areas.map((a) => a.order)) + 1 : 0 });
    machineDialog.close();
    save(); render();
  });
  function moveArea(dir) {
    const list = sortedAreas(), i = list.findIndex((a) => a.id === editingArea), j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const now = Date.now();
    list.forEach((a, k) => { a.order = k; a.updatedAt = now; });
    save(); render();
  }
  $("#machine-left").addEventListener("click", () => moveArea(-1));
  $("#machine-right").addEventListener("click", () => moveArea(1));
  $("#machine-delete").addEventListener("click", async () => {
    const a = areaById(editingArea);
    if (!a) return;
    machineDialog.close();
    const n = state.moles.filter((m) => m.areaId === a.id).length;
    if (!(await confirmBox({ title: `Remove ${a.name}?`, body: `${n ? `Its ${plural(n, "open mole")} will be deleted too. ` : ""}Your history is kept.`, ok: "Remove machine" }))) return;
    const now = Date.now();
    state.deletedIds[a.id] = now;
    for (const m of state.moles) if (m.areaId === a.id) state.deletedIds[m.id] = now;
    state.areas = state.areas.filter((x) => x.id !== a.id);
    state.moles = state.moles.filter((m) => m.areaId !== a.id);
    save();
    if (route.view === "game" && route.id === a.id) location.hash = "#/"; else render();
  });

  // ---------------- Secret GitHub Gist cloud sync ----------------
  function encodeSetupCode(token, gistId) {
    return "wal1:" + btoa(unescape(encodeURIComponent(JSON.stringify({ t: token, g: gistId }))));
  }
  function decodeSetupCode(raw) {
    const s = String(raw || "").trim();
    if (!s.startsWith("wal1:")) return null;
    try {
      const obj = JSON.parse(decodeURIComponent(escape(atob(s.slice(5)))));
      if (obj && obj.t) return { token: String(obj.t).trim(), gistId: String(obj.g || "").trim() };
    } catch {}
    return null;
  }

  function loadSyncCfg() {
    try {
      if (typeof location !== "undefined" && typeof location.hash === "string" && location.hash.startsWith("#sync=")) {
        const unpacked = decodeSetupCode(decodeURIComponent(location.hash.slice(6)));
        if (unpacked?.token) {
          const cfg = { token: unpacked.token, gistId: unpacked.gistId || DEFAULT_GIST_ID, lastSyncAt: 0, dirty: false };
          localStorage.setItem(SYNC_KEY, JSON.stringify(cfg));
          history.replaceState(null, "", "#/");
          return cfg;
        }
      }
      const c = JSON.parse(localStorage.getItem(SYNC_KEY));
      if (c && typeof c === "object" && c.token) {
        return { token: c.token || "", gistId: c.gistId || DEFAULT_GIST_ID, lastSyncAt: c.lastSyncAt || 0, dirty: !!c.dirty };
      }
      if (window.WAL_DEFAULT_SYNC && window.WAL_DEFAULT_SYNC.token) {
        const cfg = { token: String(window.WAL_DEFAULT_SYNC.token).trim(), gistId: String(window.WAL_DEFAULT_SYNC.gistId || DEFAULT_GIST_ID).trim(), lastSyncAt: 0, dirty: false };
        localStorage.setItem(SYNC_KEY, JSON.stringify(cfg));
        return cfg;
      }
      if (c && typeof c === "object" && c.gistId) {
        return { token: "", gistId: c.gistId, lastSyncAt: c.lastSyncAt || 0, dirty: false };
      }
    } catch {}
    return { token: "", gistId: DEFAULT_GIST_ID, lastSyncAt: 0, dirty: false };
  }
  let syncCfg = loadSyncCfg();
  let syncState = syncCfg.token ? (syncCfg.dirty ? "dirty" : "ok") : (syncCfg.lastSyncAt ? "ok" : "off");
  let syncError = "";
  let syncBusy = false;
  let syncTimer = null;

  const saveSyncCfg = () => localStorage.setItem(SYNC_KEY, JSON.stringify(syncCfg));

  function syncMeta() {
    if (syncBusy) return { cls: "busy", label: "Syncing…", sub: "Updating from your Secret GitHub Gist." };
    if (syncState === "error") return { cls: "err", label: "Offline or sync error", sub: syncError || "Changes are saved on this device and will sync when back online." };
    const ago = syncCfg.lastSyncAt ? `Last synced ${new Date(syncCfg.lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Ready to sync";
    if (!syncCfg.token) {
      return {
        cls: syncCfg.lastSyncAt ? "dirty" : "off",
        label: syncCfg.lastSyncAt ? "Loaded from Cloud (read-only)" : "Connect for two-way sync",
        sub: "Paste your setup code below so changes made on this device also save back to the cloud.",
      };
    }
    if (syncCfg.dirty) return { cls: "dirty", label: "Changes pending", sub: `${ago} · Waiting to push…` };
    return { cls: "ok", label: "Synced with Secret Gist", sub: `${ago}${syncCfg.gistId ? ` · Gist ${syncCfg.gistId.slice(0, 8)}…` : ""}` };
  }

  syncBtn = () => {
    const m = syncMeta();
    return `<button class="icon-btn sync-btn" data-act="sync" aria-label="Cloud sync: ${esc(m.label)}" title="Cloud sync: ${esc(m.label)}">${icon("cloud")}<span class="sync-dot ${m.cls}"></span></button>`;
  };
  function updateSyncUI() {
    for (const b of $$('[data-act="sync"]')) b.outerHTML = syncBtn();
    if ($("#sync-dialog")?.open) renderSyncDialogStatus();
  }

  async function ghFetch(path, token, opts = {}) {
    const headers = {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    };
    const res = await fetch(`https://api.github.com${path}`, {
      ...opts,
      cache: "no-store",
      headers,
    });
    if (!res.ok) {
      let msg = `GitHub API ${res.status}`;
      try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }

  async function findOrCreateGist(token) {
    const list = await ghFetch("/gists?per_page=100", token);
    const found = Array.isArray(list) && list.find((g) => g?.files && g.files[GIST_FILENAME]);
    if (found) return found.id;
    const created = await ghFetch("/gists", token, {
      method: "POST",
      body: JSON.stringify({
        description: "Whack-a-Life Sync (Private)",
        public: false,
        files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } },
      }),
    });
    return created.id;
  }

  async function syncWithGist({ forcePush = false, notifyUser = false } = {}) {
    if ((!syncCfg.token && !syncCfg.gistId) || syncBusy) return false;
    syncBusy = true;
    syncError = "";
    updateSyncUI();
    try {
      if (!syncCfg.gistId && syncCfg.token) {
        syncCfg.gistId = await findOrCreateGist(syncCfg.token);
        saveSyncCfg();
      }
      const gist = await ghFetch(`/gists/${encodeURIComponent(syncCfg.gistId)}?_=${Date.now()}`, syncCfg.token);
      const file = gist?.files?.[GIST_FILENAME];
      let remoteState = null;
      if (file?.content) {
        try { remoteState = JSON.parse(file.content); } catch {}
      }
      const beforeJSON = JSON.stringify({ areas: state.areas, moles: state.moles, history: state.history });
      if (remoteState && Array.isArray(remoteState.areas) && Array.isArray(remoteState.moles)) {
        state = mergeStates(state, remoteState);
        save({ fromSync: true });
      }
      const afterJSON = JSON.stringify({ areas: state.areas, moles: state.moles, history: state.history });
      const remoteJSON = remoteState ? JSON.stringify({ areas: remoteState.areas, moles: remoteState.moles, history: remoteState.history }) : "";
      if (syncCfg.token && (forcePush || syncCfg.dirty || !remoteState || afterJSON !== remoteJSON)) {
        await ghFetch(`/gists/${encodeURIComponent(syncCfg.gistId)}`, syncCfg.token, {
          method: "PATCH",
          body: JSON.stringify({
            files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } },
          }),
        });
      }
      syncCfg.lastSyncAt = Date.now();
      if (syncCfg.token) syncCfg.dirty = false;
      saveSyncCfg();
      syncState = "ok";
      syncBusy = false;
      updateSyncUI();
      if (beforeJSON !== afterJSON && route.view !== "play") {
        const busyEditing = $("#mole-dialog")?.open || $("#bulk-dialog")?.open || $("#machine-dialog")?.open || document.activeElement?.id === "qa-title";
        if (!busyEditing) render();
      }
      if (notifyUser) notify(`Synced <b>${state.moles.length}</b> loose moles with your Secret Gist.`);
      return true;
    } catch (err) {
      syncBusy = false;
      syncState = "error";
      syncError = err?.message || "Sync failed";
      updateSyncUI();
      if (notifyUser) notify(`Sync error: ${esc(syncError)}`);
      return false;
    }
  }

  scheduleCloudPush = () => {
    if (!syncCfg.token) return;
    syncCfg.dirty = true;
    saveSyncCfg();
    updateSyncUI();
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncWithGist({ forcePush: true }), 1200);
  };

  const syncDialog = $("#sync-dialog"), syncForm = $("#sync-form");
  function renderSyncDialogStatus() {
    const m = syncMeta();
    const ic = m.cls === "ok" ? "check" : m.cls === "busy" ? "refresh-cw" : m.cls === "err" ? "zap" : "cloud";
    $("#sync-status-card").innerHTML = `
      <span class="sync-badge ${m.cls}">${icon(ic)}</span>
      <div class="sync-card-body"><b>${esc(m.label)}</b><small>${esc(m.sub)}</small></div>`;
    const connected = !!syncCfg.token;
    $("#sync-pair-box").hidden = !connected || !syncCfg.gistId;
    $("#sync-disconnect").hidden = !connected;
    $("#sync-now").hidden = !connected;
    $("#sync-now").disabled = syncBusy;
    $("#sync-save").disabled = syncBusy;
    $("#sync-save").textContent = connected ? "Save & Sync" : "Connect & Sync";
  }

  function openSyncDialog() {
    const f = syncForm.elements;
    f.token.value = syncCfg.token || "";
    f.gistId.value = syncCfg.gistId || "";
    renderSyncDialogStatus();
    syncDialog.showModal();
    if (!syncCfg.token) f.token.focus();
  }

  $("#sync-token").addEventListener("input", (e) => {
    const decoded = decodeSetupCode(e.target.value);
    if (decoded) {
      e.target.value = decoded.token;
      $("#sync-gist").value = decoded.gistId || "";
    }
  });

  syncForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rawToken = syncForm.elements.token.value.trim();
    const decoded = decodeSetupCode(rawToken);
    const token = decoded ? decoded.token : rawToken;
    const gistId = (decoded ? decoded.gistId : syncForm.elements.gistId.value.trim()) || DEFAULT_GIST_ID;
    if (!token) return;
    syncCfg.token = token;
    syncCfg.gistId = gistId;
    syncCfg.dirty = true;
    saveSyncCfg();
    const ok = await syncWithGist({ forcePush: true, notifyUser: true });
    if (ok) {
      syncForm.elements.gistId.value = syncCfg.gistId;
      renderSyncDialogStatus();
      render();
      setTimeout(() => { if (syncDialog.open) syncDialog.close(); }, 350);
    }
  });

  $("#sync-now").addEventListener("click", () => syncWithGist({ forcePush: true, notifyUser: true }));
  $("#sync-copy-code").addEventListener("click", async () => {
    if (!syncCfg.token || !syncCfg.gistId) return;
    const code = encodeSetupCode(syncCfg.token, syncCfg.gistId);
    try {
      await navigator.clipboard.writeText(code);
      const btn = $("#sync-copy-code");
      btn.innerHTML = `${icon("check")}Copied!`;
      setTimeout(() => { if (btn) btn.innerHTML = `${icon("copy")}Copy code`; }, 2200);
    } catch {
      prompt("Copy this setup code for your other device:", code);
    }
  });
  $("#sync-disconnect").addEventListener("click", async () => {
    syncDialog.close();
    if (!(await confirmBox({ title: "Disconnect Cloud sync?", body: "Your tasks stay on this device and in your Secret Gist, but this device will stop syncing automatically.", ok: "Disconnect" }))) return;
    clearTimeout(syncTimer);
    syncCfg = { token: "", gistId: "", lastSyncAt: 0, dirty: false };
    syncState = "off";
    syncError = "";
    saveSyncCfg();
    updateSyncUI();
    notify("Cloud sync disconnected on this device.");
  });

  // history dialog
  const statsDialog = $("#stats-dialog");
  function openStats() { renderStats(); statsDialog.showModal(); }
  function renderStats() {
    const byDay = {};
    for (const h of state.history) { const k = dayKey(h.whackedAt); byDay[k] = (byDay[k] || 0) + 1; }
    const today = dayKey();
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const max = Math.max(1, ...days.map((d) => byDay[d] || 0));
    const weekStart = keyToDate(days[0]).getTime();
    const week = state.history.filter((h) => h.whackedAt >= weekStart);
    const per = sortedAreas().map((a) => ({ a, n: week.filter((h) => h.areaId === a.id).length, calm: areaCalm(a.id) }));
    const maxA = Math.max(1, ...per.map((x) => x.n));
    const tile = (ic, label, val) => `<div class="tile-stat"><span class="pill-ic">${icon(ic)}</span><small>${label}</small><b>${val}</b></div>`;

    $("#stats-body").innerHTML = `
      <div class="tiles">
        ${tile("check", "Whacked today", byDay[today] || 0)}
        ${tile("calendar", "This week", week.length)}
        ${tile("hammer", "All time", state.history.length)}
        ${tile("list", "Still loose", state.moles.length)}
      </div>
      <h3 class="sub-h">Last 7 days</h3>
      <div class="bars" role="img" aria-label="Tasks done per day for the last 7 days">
        ${days.map((d) => { const n = byDay[d] || 0; return `<div class="col"><span class="n">${n || ""}</span><span class="bar${d === today ? " now" : ""}" style="height:${(n / max) * 78}%"></span><small>${keyToDate(d).toLocaleDateString(undefined, { weekday: "short" })}</small></div>`; }).join("")}
      </div>
      <h3 class="sub-h">This week by machine</h3>
      <ul class="m-rows">
        ${per.map(({ a, n, calm }) => `<li style="${themeVars(themeOf(a))}"><span class="tile xs">${icon(a.icon)}</span><span class="m-name">${esc(a.name)}</span>
          <span class="meter"><span style="width:${(n / maxA) * 100}%;background:var(--c1)"></span></span><span class="m-n">${n}</span><span class="m-calm" style="--col:${calmInfo(calm).color}">${calm}%</span></li>`).join("")}
      </ul>
      <h3 class="sub-h">Done log</h3>
      ${state.history.length ? `<ul class="history">${state.history.slice(0, 100).map((h) => { const a = areaById(h.areaId); return `
        <li style="${themeVars(themeOf(a))}"><span class="tile xs">${icon(a ? a.icon : "package")}</span><span class="h-title" dir="auto">${esc(h.title)}</span>
          <span class="r-time">${new Date(h.whackedAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></li>`; }).join("")}</ul>`
        : `<p class="empty-msg">Nothing done yet.</p>`}`;
  }

  // backup
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `whack-a-life-backup-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const s = JSON.parse(await file.text());
      if (!Array.isArray(s.areas) || !Array.isArray(s.moles)) throw new Error("This file isn't a Whack-a-Life backup.");
      if (!(await confirmBox({ title: "Restore backup?", body: "This replaces everything currently in the arcade.", ok: "Restore", danger: false }))) return;
      state = migrate(s);
      save();
      if (route.view === "game" && !areaById(route.id)) location.hash = "#/"; else render();
    } catch (err) { await confirmBox({ title: "Import failed", body: err.message, ok: "OK", danger: false }); }
  });

  // keyboard
  document.addEventListener("keydown", (e) => {
    if ($("dialog[open]") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) { if (e.key === "Escape") document.activeElement.blur(); return; }
    if (e.key === "Escape" && route.view !== "hall") { location.hash = "#/"; return; }
    if (route.view === "play") return;
    if (e.key === "l" || e.key === "L") { e.preventDefault(); return openBulk(); }
    if (e.key === "n" || e.key === "N" || e.key === "/") { e.preventDefault(); if (route.view === "game") $("#qa-title")?.focus(); else openMoleDialog(); }
    else if (route.view === "hall" && e.key === "0") enterPlay();
    else if (route.view === "hall" && /^[1-9]$/.test(e.key)) { const a = sortedAreas()[Number(e.key) - 1]; if (a) enter(a.id); }
  });

  // one-time task imports from seeds.js (merged, never overwriting)
  function applySeeds() {
    const seeds = window.WAL_SEEDS || [];
    state.appliedSeeds ||= [];
    const norm = (t) => t.trim().toLowerCase();
    let added = 0, done = 0, renamed = 0;
    for (const seed of seeds) {
      if (state.appliedSeeds.includes(seed.id)) continue;
      if (seed.rename) {
        const map = new Map(Object.entries(seed.rename).map(([from, to]) => [norm(from), to]));
        for (const item of [...state.moles, ...state.history]) if (map.has(norm(item.title))) { item.title = map.get(norm(item.title)); renamed++; }
      }
      const areaFor = (name) => {
        const key = norm(name);
        let a = state.areas.find((x) => norm(x.name) === key || (key === "apartment" && norm(x.name) === "appartement"));
        if (!a) {
          a = { id: uid(), name, order: Math.max(-1, ...state.areas.map((x) => x.order)) + 1, updatedAt: Date.now() };
          state.areas.push(a);
          migrate(state);
        }
        return a;
      };
      const open = new Set(state.moles.map((m) => norm(m.title)));
      const finished = new Set(state.history.map((h) => norm(h.title)));
      let t = Date.now();
      for (const m of seed.moles || []) {
        if (open.has(norm(m.title))) continue;
        const ts = t++;
        state.moles.push({ id: uid(), createdAt: ts, updatedAt: ts, areaId: areaFor(m.area).id, title: m.title, due: m.due || null, urgency: URG[m.urgency] ? m.urgency : "medium" });
        open.add(norm(m.title)); added++;
      }
      for (const d of seed.done || []) {
        if (finished.has(norm(d.title))) continue;
        const when = d.date ? keyToDate(d.date).getTime() + 12 * 3600e3 : Date.now();
        const hid = uid();
        state.history.push({ id: hid, moleId: hid, areaId: areaFor(d.area).id, title: d.title, urgency: "medium", due: null, whackedAt: when });
        finished.add(norm(d.title)); done++;
      }
      state.appliedSeeds.push(seed.id);
    }
    state.history.sort((a, b) => b.whackedAt - a.whackedAt);
    return { added, done, renamed };
  }
  function notify(html) {
    const toast = $("#toast");
    toast.innerHTML = `<span class="toast-ic ok">${icon("check")}</span><span class="toast-msg">${html}</span>`;
    toast.hidden = false;
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => (toast.hidden = true), 7000);
  }

  // boot
  const seeded = applySeeds();
  let lastDay = dayKey();
  setInterval(() => { if (dayKey() !== lastDay && route.view !== "play") { lastDay = dayKey(); render(); } }, 60_000);
  window.addEventListener("storage", (e) => { if (e.key === STORAGE_KEY && route.view !== "play") { state = load(); render(); } });
  window.addEventListener("resize", () => { if (route.view === "hall") fitMachines(app); });
  narrowMQ.addEventListener("change", () => { if (route.view === "game" || (route.view === "play" && !play)) render(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && (syncCfg.token || syncCfg.gistId)) syncWithGist(); });
  window.addEventListener("focus", () => { if ((syncCfg.token || syncCfg.gistId) && Date.now() - (syncCfg.lastSyncAt || 0) > 15_000) syncWithGist(); });
  window.addEventListener("online", () => { if (syncCfg.token || syncCfg.gistId) syncWithGist({ forcePush: syncCfg.dirty }); });

  hydrateIcons();
  save({ fromSync: !(seeded.added || seeded.done || seeded.renamed) });
  renderView({ intro: true });
  if (syncCfg.token || syncCfg.gistId) syncWithGist({ forcePush: syncCfg.dirty });
  const seedMsg = [
    seeded.added && `added <b>${seeded.added}</b> new ${seeded.added === 1 ? "mole" : "moles"}`,
    seeded.done && `logged <b>${seeded.done}</b> finished ${seeded.done === 1 ? "task" : "tasks"}`,
    seeded.renamed && `shortened <b>${seeded.renamed}</b> ${seeded.renamed === 1 ? "name" : "names"}`,
  ].filter(Boolean).join(", ");
  if (seedMsg) notify(seedMsg[0].toUpperCase() + seedMsg.slice(1) + ".");

  const lv = levelInfo(), year = new Date().getFullYear();
  if (lv.isBirthday && state.settings.bdayShown !== year) {
    state.settings.bdayShown = year; save();
    setTimeout(() => banner(`Level ${lv.age}!`, "Happy birthday"), 600);
  }

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();
