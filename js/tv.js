document.body.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) {
    document.documentElement
      .requestFullscreen()
      .catch((err) => console.log("Gagal Fullscreen"));
  } else {
    document.exitFullscreen();
  }
});

const SUPABASE_URL = "https://gubcvxiupehbdpigrdct.supabase.co";
const SUPABASE_KEY = "sb_publishable_k1y6fNI2opEXhwqKMbGYcA__2nD0yT6";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
let TOURNAMENT_ID = urlParams.get("id") || "vip";

let reqCourts = urlParams.get("courts");
let targetCourts = reqCourts
  ? reqCourts.split(",").map((c) => c.trim().toLowerCase())
  : [];

let matches = [];
let cardPreset = "classic-white";
let hideServeGlobal = false;

async function init() {
  const { data } = await db
    .from("partners")
    .select("*")
    .eq("tournament_id", TOURNAMENT_ID)
    .maybeSingle();
  if (data) applyTheme(data);
  await fetchMatches();
  subscribe();
}

function applyTheme(d) {
  const r = document.documentElement.style;
  window.GLOBAL_PARTNER_DATA = d; // Simpan ke memori lokal
  r.setProperty("--font-main", d.font_family || "Montserrat");
  r.setProperty("--primary-start", d.color_primary || "#222");
  r.setProperty("--primary-end", d.color_gradient_end || d.color_primary);
  r.setProperty("--live-neon", d.color_neon || "#76FF03");
  r.setProperty("--bg-color", d.color_bg || "#000000");
  document.body.style.backgroundColor = d.color_bg || "#000000";

  hideServeGlobal = d.hide_serve === "true";
  cardPreset = d.card_preset || "classic-white";
  r.setProperty("--card-radius", (d.corner_radius || 15) + "px");
  if (d.bg_image_url) {
    document.body.style.backgroundImage = `url('${d.bg_image_url}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
  }

  const tvTitle = d.tv_title || "";
  const tvSub = d.tv_sub || "";
  const tvTag = d.tv_tag || "";
  const tvLogo = d.tv_logo || "";
  const tvLogoPos = d.tv_logo_pos || "kiri";

  let cT = "#ffffff",
    sT = "1",
    xT = "0",
    yT = "0";
  let cS = "#ffeb3b",
    sS = "1",
    xS = "0",
    yS = "0";
  let cTag = "#ffffff",
    sTag = "1",
    xTag = "0",
    yTag = "0";
  let sL = "1",
    xL = "0",
    yL = "0";

  if (d.tv_style) {
    try {
      let ts = JSON.parse(d.tv_style);
      cT = ts.cT || "#ffffff";
      sT = ts.sT || "1";
      xT = ts.xT || "0";
      yT = ts.yT || "0";
      cS = ts.cS || "#ffeb3b";
      sS = ts.sS || "1";
      xS = ts.xS || "0";
      yS = ts.yS || "0";
      cTag = ts.cTag || "#ffffff";
      sTag = ts.sTag || "1";
      xTag = ts.xTag || "0";
      yTag = ts.yTag || "0";
      sL = ts.sL || "1";
      xL = ts.xL || "0";
      yL = ts.yL || "0";
    } catch (e) {
      console.error("Error parsing tv_style JSON", e);
    }
  }

  let tBase = tvLogo && tvLogoPos === "kiri" ? 12 : 3;
  let sBase = tBase + 28;
  let tagBase = sBase + 20;

  let logoHTML = "";
  if (tvLogo) {
    if (tvLogoPos === "kiri")
      logoHTML = `<img src="${tvLogo}" style="position:absolute; top:50%; left:3vw; transform:translate(${xL}vw, calc(-50% + ${yL}vh)) scale(${sL}); transform-origin:left center; height:6vh; z-index:15; object-fit:contain;">`;
    else if (tvLogoPos === "kanan")
      logoHTML = `<img src="${tvLogo}" style="position:absolute; top:50%; right:3vw; transform:translate(${xL}vw, calc(-50% + ${yL}vh)) scale(${sL}); transform-origin:right center; height:6vh; z-index:15; object-fit:contain;">`;
    else if (tvLogoPos === "tengah")
      logoHTML = `<img src="${tvLogo}" style="position:absolute; top:50%; left:50%; transform:translate(calc(-50% + ${xL}vw), calc(-50% + ${yL}vh)) scale(${sL}); transform-origin:center center; height:25vh; opacity:0.15; z-index:1; pointer-events:none; object-fit:contain;">`;
  }

  let tHTML = tvTitle
    ? `<h1 style="position:absolute; top:50%; left:${tBase}vw; transform:translate(${xT}vw, calc(-50% + ${yT}vh)) scale(${sT}); transform-origin:left center; color:${cT}; margin:0; font-size:2.5vw; font-weight:900; letter-spacing:2px; text-transform:uppercase; text-shadow:0 4px 10px rgba(0,0,0,0.5); white-space:nowrap; z-index:15;">${tvTitle}</h1>`
    : "";

  let sHTML = tvSub
    ? `<span style="position:absolute; top:50%; left:${sBase}vw; transform:translate(${xS}vw, calc(-50% + ${yS}vh)) scale(${sS}); transform-origin:left center; color:${cS}; font-size:1.2vw; opacity:0.8; font-weight:700; text-shadow:0 2px 5px rgba(0,0,0,0.5); white-space:nowrap; z-index:15;">${tvSub}</span>`
    : "";

  let tagHTML = tvTag
    ? `<div style="position:absolute; top:50%; left:${tagBase}vw; transform:translate(${xTag}vw, calc(-50% + ${yTag}vh)) scale(${sTag}); transform-origin:left center; color:${cTag}; border:1px solid ${cTag}; padding:0.5vh 1.5vw; border-radius:30px; background:rgba(255,255,255,0.1); font-size:0.9vw; font-weight:800; text-transform:uppercase; letter-spacing:1px; backdrop-filter:blur(5px); z-index:15; white-space:nowrap;">${tvTag}</div>`
    : "";

  const h1 = d.color_primary || "#222";
  const h2 = d.color_gradient_end || d.color_primary || "#111";

  document.getElementById("tv-header-container").innerHTML = `
                <div style="background:linear-gradient(135deg, ${h1}, ${h2}); border-bottom:3px solid rgba(255,255,255,0.1); box-shadow:0 5px 15px rgba(0,0,0,0.5); height:10vh; position:relative; z-index:10; overflow:hidden; width:100%; flex-shrink:0;">
                    ${logoHTML}
                    ${tHTML}
                    ${sHTML}
                    ${tagHTML}
                </div>
            `;

  if (matches.length > 0) renderTV();
}

async function fetchMatches() {
  const { data: mData } = await db
    .from("matches_pro")
    .select("*")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("status", "LIVE")
    .order("created_at", { ascending: true });
  if (mData) {
    mData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    matches = mData;
    renderTV();
  }
}

// 💡 LOGIKA CENTER-HUGGING (MEMELUK TENGAH) & NEON DOT DI DALAM
function formatTeamName(teamString, serverState, isTeamA) {
  teamString = String(teamString || ""); // VAKSIN DOSIS TINGGI
  const renderRow = (name, isServ) => {
    let dot = isServ ? '<span class="neon-dot"></span>' : "";

    if (isTeamA) {
      // TIM A (Kiri): Teks rata kanan, menempel skor di ujung kanan
      return `<div style="display:flex; flex-direction:row; align-items:center; justify-content:flex-end; width:100%; min-width:0; gap:0.5vw;">
                                <span class="team-name" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; white-space:normal; overflow:hidden; text-overflow:ellipsis; flex:1; text-align:right; word-break:break-word;">${name}</span>
                                ${dot}
                            </div>`;
    } else {
      // TIM B (Kanan): Teks rata kiri, menempel skor di ujung kiri
      return `<div style="display:flex; flex-direction:row; align-items:center; justify-content:flex-start; width:100%; min-width:0; gap:0.5vw;">
                                ${dot}
                                <span class="team-name" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; white-space:normal; overflow:hidden; text-overflow:ellipsis; flex:1; text-align:left; word-break:break-word;">${name}</span>
                            </div>`;
    }
  };

  if (!teamString.includes("/")) {
    let isServing =
      !hideServeGlobal &&
      (serverState === (isTeamA ? "a" : "b") || serverState === teamString);
    return `<div style="display:flex; flex-direction:column; width:100%; gap:1vh; min-width:0;">${renderRow(teamString, isServing)}</div>`;
  }

  let players = teamString.split("/").map((x) => x.trim());
  let isS1 = !hideServeGlobal && serverState === players[0];
  let isS2 = !hideServeGlobal && serverState === players[1];

  return `<div style="display:flex; flex-direction:column; width:100%; gap:1vh; min-width:0;">
                        ${renderRow(players[0], isS1)}
                        ${renderRow(players[1], isS2)}
                    </div>`;
}

function renderTV() {
  const gridEl = document.getElementById("tv-grid");

  let liveMatches = matches;
  if (targetCourts.length > 0) {
    liveMatches = matches.filter((m) =>
      targetCourts.includes(String(m.court_name).trim().toLowerCase()),
    );
  }

  if (liveMatches.length === 0) {
    gridEl.className = "grid-1";
    let txt =
      targetCourts.length > 0
        ? `TIDAK ADA PERTANDINGAN LIVE DI COURT TERPILIH`
        : `BELUM ADA PERTANDINGAN LIVE`;
    gridEl.innerHTML = `<div class="empty-state">${txt}</div>`;
    return;
  }

  gridEl.className = "";
  if (liveMatches.length === 1) gridEl.classList.add("grid-1");
  else if (liveMatches.length === 2) gridEl.classList.add("grid-2");
  else if (liveMatches.length === 3) gridEl.classList.add("grid-3");
  else if (liveMatches.length === 4) gridEl.classList.add("grid-4");
  else if (liveMatches.length <= 6) gridEl.classList.add("grid-6");
  else gridEl.classList.add("grid-many");

  gridEl.innerHTML = "";

  liveMatches.forEach((m) => {
    let themeClass = "theme-" + cardPreset;

    let tb = String(m.team_b || "").trim();
    let cat = String(m.category || "").trim();
    let rnd = String(m.round || "").trim();

    // SIHIR BUNGLON ELEGAN TV: Jika Tim B kosong atau strip (-)
    if (tb === "" || tb === "-") {
      let cardClass = m.status === "LIVE" ? "match-card is-live" : "match-card";
      let showCat = cat !== "" && cat !== "-" ? cat : "SPECIAL EVENT";
      let showRound = rnd !== "" && rnd !== "-" ? " • " + rnd : "";

      // MENGGUNAKAN CLASS CSS ASLI AGAR UKURAN SCALING TETAP SEMPURNA
      gridEl.innerHTML += `
                    <div class="${cardClass} ${themeClass}">
                        <div style="display:flex; justify-content:center; align-items:center; border-bottom:2px solid rgba(0,0,0,0.1); padding-bottom:1vh; margin-bottom:1.5vh; min-width:0; flex-shrink:0;">
                            <span class="meta-text" style="text-align:center;">🌟 ${showCat}${showRound} 🌟</span>
                        </div>
                        
                        <div style="display:flex; align-items:center; justify-content:center; flex:1; min-width:0; min-height:0; text-align:center;">
                            <div class="team" style="align-items:center;">
                                <span class="team-name" style="white-space:normal; line-height:1.2; text-transform:uppercase;">${m.team_a || "ACARA / EVENT"}</span>
                            </div>
                        </div>

                        <div style="text-align:center; margin-top:1.5vh; min-width:0; flex-shrink:0;">
                            <span class="court-badge">${m.court_name || ""}</span>
                        </div>
                    </div>`;
      return;
    }

    // --- RENDER PERTANDINGAN NORMAL ---
    let sets = [];
    let maxSet = m.current_set || 1;
    for (let i = 1; i <= 5; i++) {
      let sa = parseInt(m[`set${i}_a`]) || 0;
      let sb = parseInt(m[`set${i}_b`]) || 0;
      let isCurr = (m.current_set || 1) == i;
      if (isCurr || sa > 0 || sb > 0 || (i === 1 && maxSet === 1)) {
        if (isCurr) {
          sets.push(
            `<span class="set-txt" style="color:var(--live-neon); text-shadow: 0 0 10px rgba(0,0,0,0.8);">${sa}-${sb}</span>`,
          );
        } else {
          sets.push(`<span class="set-txt">${sa}-${sb}</span>`);
        }
      }
    }
    if (sets.length === 0) sets.push(`<span class="set-txt">0-0</span>`);

    let scoreStr =
      `<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:0.5vw; align-items:center; line-height:1.2;">` +
      sets.join('<span style="opacity:0.3; font-size:0.6em;">•</span>') +
      `</div>`;
    let smallPt = `<div class="point-txt"><span style="color:var(--live-neon)">${m.points_a || 0} - ${m.points_b || 0}</span></div>`;

    let metaHTML = `<span class="meta-text">${m.category} • ${m.round}</span>`;
    let timeInfo =
      '<div class="live-tag"><div class="dot-live"></div> LIVE</div>';

    let teamA_Formatted = formatTeamName(m.team_a, m.server, true);
    let teamB_Formatted = formatTeamName(m.team_b, m.server, false);

    gridEl.innerHTML += `
                <div class="match-card ${themeClass} is-live">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid rgba(0,0,0,0.1); padding-bottom:1vh; margin-bottom:1.5vh; min-width:0; flex-shrink:0;">
                        ${metaHTML} ${timeInfo}
                    </div>
                    
                    <div style="display:flex; align-items:center; justify-content:center; flex:1; gap:0.5vw; min-width:0; min-height:0;">
                        
                        <div class="team" style="align-items:flex-end;">${teamA_Formatted}</div>
                        
                        <div class="score-pill">${scoreStr}${smallPt}</div>
                        
                        <div class="team" style="align-items:flex-start;">${teamB_Formatted}</div>
                        
                    </div>

                    <div style="text-align:center; margin-top:1.5vh; min-width:0; flex-shrink:0;">
                        <span class="court-badge">${m.court_name}</span>
                    </div>
                </div>`;
  });
}

let fetchTimeout = null;
function triggerFetch() {
  clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(() => {
    fetchMatches();
  }, 500);
}

function subscribe() {
  db.channel("public:matches_pro")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "matches_pro",
        filter: `tournament_id=eq.${TOURNAMENT_ID}`,
      },
      () => triggerFetch(),
    )
    .subscribe();
  db.channel("public:partners")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "partners",
        filter: `tournament_id=eq.${TOURNAMENT_ID}`,
      },
      (p) => applyTheme(p.new),
    )
    .subscribe();
}

init();
