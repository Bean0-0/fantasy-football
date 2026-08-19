// ==UserScript==
// @name         Yahoo Fantasy Draft Assistant — MFL
// @namespace    https://github.com/Bean0-0/fantasy-football
// @version      0.2.0
// @description  Live draft assistant tuned for MFL league: 10-team, 0.5 PPR, snake draft, 16 rounds
// @match        https://football.fantasysports.yahoo.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  /* ============================================================
   * LEAGUE CONFIG — MFL (Meemaw Football League), ID 1306729
   * 10 teams · 0.5 PPR · snake · 16 rounds · 45s pick timer
   * Starters: QB, WR, WR, RB, RB, TE, W/R/T, K, DEF + 6 BN
   * ============================================================ */
  const TEAMS = 10;
  const ROUNDS = 16;

  // Roster targets across 16 picks (bench depth included)
  const ROSTER_TARGETS = { QB: 1, RB: 5, WR: 6, TE: 2, K: 1, DEF: 1 };
  // Starters per position (flex counted separately)
  const STARTERS = { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 };

  /* ============================================================
   * BOARD — [rank, name, pos, team, bye, tier, adp]
   * 0.5 PPR flavor. REPLACE WITH CURRENT RANKINGS BEFORE DRAFT.
   * K and DEF intentionally late — never draft them early.
   * ============================================================ */
  const BOARD = [[1, "Jahmyr Gibbs", "RB", "DET", 0, 1, 1.4], [2, "Bijan Robinson", "RB", "ATL", 0, 1, 2.4], [3, "Puka Nacua", "WR", "LAR", 0, 2, 4.7], [4, "Ja'Marr Chase", "WR", "CIN", 0, 2, 3.2], [5, "Christian McCaffrey", "RB", "SF", 0, 2, 5.7], [6, "Jonathan Taylor", "RB", "IND", 0, 2, 6.1], [7, "James Cook", "RB", "BUF", 0, 2, 8.9], [8, "Derrick Henry", "RB", "BAL", 0, 2, 17.8], [9, "Jaxon Smith-Njigba", "WR", "SEA", 0, 2, 7.7], [10, "Ashton Jeanty", "RB", "LV", 0, 2, 11.9], [11, "De'Von Achane", "RB", "MIA", 0, 2, 14.5], [12, "Amon-Ra St. Brown", "WR", "DET", 0, 2, 8.3], [13, "Saquon Barkley", "RB", "PHI", 0, 2, 12.9], [14, "Chase Brown", "RB", "CIN", 0, 2, 16.4], [15, "Kenneth Walker", "RB", "KC", 0, 2, 17.8], [16, "CeeDee Lamb", "WR", "DAL", 0, 2, 10.6], [17, "Omarion Hampton", "RB", "LAC", 0, 2, 15.8], [18, "Brock Bowers", "TE", "LV", 0, 2, 21.9], [19, "Josh Allen", "QB", "BUF", 0, 2, 22.9], [20, "Nico Collins", "WR", "HOU", 0, 2, 23.2], [21, "A.J. Brown", "WR", "NE", 0, 2, 19.0], [22, "George Pickens", "WR", "DAL", 0, 2, 26.8], [23, "Justin Jefferson", "WR", "MIN", 0, 2, 13.9], [24, "Drake London", "WR", "ATL", 0, 2, 20.6], [25, "Trey McBride", "TE", "ARI", 0, 2, 24.9], [26, "Chris Olave", "WR", "NO", 0, 2, 32.7], [27, "Breece Hall", "RB", "NYJ", 0, 2, 30.4], [28, "Kyren Williams", "RB", "LAR", 0, 2, 26.4], [29, "DeVonta Smith", "WR", "PHI", 0, 2, 34.0], [30, "David Montgomery", "RB", "HOU", 0, 2, 49.9], [31, "Travis Etienne", "RB", "NO", 0, 2, 41.0], [32, "D'Andre Swift", "RB", "CHI", 0, 2, 52.8], [33, "Ladd McConkey", "WR", "LAC", 0, 2, 40.3], [34, "Zay Flowers", "WR", "BAL", 0, 2, 42.7], [35, "Colston Loveland", "TE", "CHI", 0, 2, 44.8], [36, "Javonte Williams", "RB", "DAL", 0, 2, 33.9], [37, "Mike Evans", "WR", "SF", 0, 2, 60.3], [38, "Jeremiyah Love", "RB", "ARI", 0, 2, 25.2], [39, "Tee Higgins", "WR", "CIN", 0, 2, 38.5], [40, "Malik Nabers", "WR", "NYG", 0, 2, 31.5], [41, "Emeka Egbuka", "WR", "TB", 0, 2, 39.8], [42, "Rashee Rice", "WR", "KC", 0, 2, 28.5], [43, "Josh Jacobs", "RB", "GB", 0, 2, 29.2], [44, "Tetairoa McMillan", "WR", "CAR", 0, 2, 35.3], [45, "Garrett Wilson", "WR", "NYJ", 0, 2, 43.6], [46, "Jaylen Waddle", "WR", "DEN", 0, 2, 48.4], [47, "Cam Skattebo", "RB", "NYG", 0, 2, 37.5], [48, "Quinshon Judkins", "RB", "CLE", 0, 2, 46.2], [49, "Bucky Irving", "RB", "TB", 0, 2, 44.8], [50, "Terry McLaurin", "WR", "WAS", 0, 2, 53.9], [51, "Parker Washington", "WR", "JAX", 0, 2, 75.4], [52, "Jameson Williams", "WR", "DET", 0, 2, 57.8], [53, "Christian Watson", "WR", "GB", 0, 2, 68.8], [54, "Lamar Jackson", "QB", "BAL", 0, 2, 35.5], [55, "Rome Odunze", "WR", "CHI", 0, 2, 62.2], [56, "Tyler Warren", "TE", "IND", 0, 2, 50.1], [57, "Luther Burden", "WR", "CHI", 0, 2, 55.5], [58, "Sam LaPorta", "TE", "DET", 0, 2, 65.1], [59, "Drake Maye", "QB", "NE", 0, 2, 51.0], [60, "Brian Thomas", "WR", "JAX", 0, 2, 70.4], [61, "Jayden Reed", "WR", "GB", 0, 2, 103.3], [62, "Davante Adams", "WR", "LAR", 0, 2, 58.6], [63, "LAR DST", "DEF", "LAR", 0, 2, 133.6], [64, "Jalen Hurts", "QB", "PHI", 0, 2, 64.8], [65, "Jadarian Price", "RB", "SEA", 0, 2, 61.3], [66, "Jayden Daniels", "QB", "WAS", 0, 2, 66.3], [67, "HOU DST", "DEF", "HOU", 0, 2, 134.4], [68, "Harold Fannin", "TE", "CLE", 0, 2, 71.7], [69, "Bhayshul Tuten", "RB", "JAX", 0, 2, 59.1], [70, "SEA DST", "DEF", "SEA", 0, 2, 134.1], [71, "Joe Burrow", "QB", "CIN", 0, 2, 53.3], [72, "Marvin Harrison", "WR", "ARI", 0, 2, 73.2], [73, "Tucker Kraft", "TE", "GB", 0, 2, 67.5], [74, "Brandon Aubrey", "K", "DAL", 0, 2, 132.3], [75, "Rhamondre Stevenson", "RB", "NE", 0, 2, 78.0], [76, "Dak Prescott", "QB", "DAL", 0, 2, 89.8], [77, "Kyle Pitts", "TE", "ATL", 0, 2, 71.0], [78, "Trevor Lawrence", "QB", "JAX", 0, 2, 97.1], [79, "George Kittle", "TE", "SF", 0, 2, 89.9], [80, "Brock Purdy", "QB", "SF", 0, 2, 116.8], [81, "DK Metcalf", "WR", "PIT", 0, 2, 77.6], [82, "TreVeyon Henderson", "RB", "NE", 0, 2, 47.0], [83, "Ka'imi Fairbairn", "K", "HOU", 0, 2, 141.6], [84, "PHI DST", "DEF", "PHI", 0, 2, 139.2], [85, "Jaylen Warren", "RB", "PIT", 0, 2, 69.9], [86, "Alec Pierce", "WR", "IND", 0, 2, 92.7], [87, "Cam Little", "K", "JAX", 0, 2, 143.7], [88, "Travis Kelce", "TE", "KC", 0, 2, 98.9], [89, "Jason Myers", "K", "SEA", 0, 2, 138.9], [90, "DEN DST", "DEF", "DEN", 0, 2, 137.7], [91, "BAL DST", "DEF", "BAL", 0, 2, 147.2], [92, "Caleb Williams", "QB", "CHI", 0, 2, 76.1], [93, "Will Reichard", "K", "MIN", 0, 2, 183.6], [94, "DJ Moore", "WR", "BUF", 0, 2, 56.2], [95, "Mark Andrews", "TE", "BAL", 0, 2, 119.8], [96, "J.K. Dobbins", "RB", "DEN", 0, 2, 87.6], [97, "Chris Boswell", "K", "PIT", 0, 2, 184.2], [98, "DET DST", "DEF", "DET", 0, 2, 173.6], [99, "MIN DST", "DEF", "MIN", 0, 2, 159.6], [100, "NE DST", "DEF", "NE", 0, 2, 152.0], [101, "Jaxson Dart", "QB", "NYG", 0, 2, 96.3], [102, "Bo Nix", "QB", "DEN", 0, 2, 116.7], [103, "Tony Pollard", "RB", "TEN", 0, 2, 82.7], [104, "Carnell Tate", "WR", "TEN", 0, 2, 62.5], [105, "Courtland Sutton", "WR", "DEN", 0, 2, 84.1], [106, "Dalton Kincaid", "TE", "BUF", 0, 2, 94.7], [107, "Harrison Mevis", "K", "LAR", 0, 2, 157.7], [108, "Tyler Loop", "K", "BAL", 0, 2, 188.4], [109, "Evan McPherson", "K", "CIN", 0, 2, 181.8], [110, "Cameron Dicker", "K", "LAC", 0, 2, 136.5], [111, "JAX DST", "DEF", "JAX", 0, 2, 161.5], [112, "Justin Herbert", "QB", "LAC", 0, 2, 80.1], [113, "Jake Bates", "K", "DET", 0, 2, 154.7], [114, "Chase McLaughlin", "K", "TB", 0, 2, 205.8], [115, "Brenton Strange", "TE", "JAX", 0, 2, 155.3], [116, "Jordan Mason", "RB", "MIN", 0, 2, 104.2], [117, "Kyle Monangai", "RB", "CHI", 0, 2, 86.5], [118, "Tyler Bass", "K", "BUF", 0, 2, 519.9], [119, "PIT DST", "DEF", "PIT", 0, 2, 170.5], [120, "Jordan Addison", "WR", "MIN", 0, 2, 101.7], [121, "Matthew Golden", "WR", "GB", 0, 2, 123.2], [122, "Rico Dowdle", "RB", "PIT", 0, 2, 83.5], [123, "KC DST", "DEF", "KC", 0, 2, 220.4], [124, "Isaiah Likely", "TE", "NYG", 0, 2, 114.9], [125, "Eddy Pineiro", "K", "SF", 0, 2, 169.5], [126, "DAL DST", "DEF", "DAL", 0, 2, 239.8], [127, "GB DST", "DEF", "GB", 0, 2, 206.5], [128, "LAC DST", "DEF", "LAC", 0, 2, 185.3], [129, "NYG DST", "DEF", "NYG", 0, 2, 575.9], [130, "Chris Godwin", "WR", "TB", 0, 2, 95.1], [131, "Jake Ferguson", "TE", "DAL", 0, 2, 106.0], [132, "Hunter Henry", "TE", "NE", 0, 2, 145.2], [133, "Makai Lemon", "WR", "PHI", 0, 2, 85.6], [134, "Jakobi Meyers", "WR", "JAX", 0, 2, 111.3], [135, "Josh Downs", "WR", "IND", 0, 2, 110.6], [136, "Jayden Higgins", "WR", "HOU", 0, 2, 125.1], [137, "Jonathon Brooks", "RB", "CAR", 0, 2, 91.7], [138, "Michael Wilson", "WR", "ARI", 0, 2, 88.1], [139, "Michael Pittman", "WR", "PIT", 0, 2, 100.9], [140, "T.J. Hockenson", "TE", "MIN", 0, 2, 187.0], [141, "Jalen Coker", "WR", "CAR", 0, 2, 146.3], [142, "Patrick Mahomes", "QB", "KC", 0, 2, 105.8], [143, "Chuba Hubbard", "RB", "CAR", 0, 2, 74.2], [144, "Wan'Dale Robinson", "WR", "TEN", 0, 2, 112.7], [145, "Khalil Shakir", "WR", "BUF", 0, 2, 131.9], [146, "Quentin Johnston", "WR", "LAC", 0, 2, 102.7], [147, "Xavier Worthy", "WR", "KC", 0, 2, 121.0], [148, "Romeo Doubs", "WR", "NE", 0, 2, 122.6], [149, "Jared Goff", "QB", "DET", 0, 2, 128.8], [150, "Matthew Stafford", "QB", "LAR", 0, 2, 109.1], [151, "Oronde Gadsden", "TE", "LAC", 0, 2, 124.2], [152, "Chig Okonkwo", "TE", "WAS", 0, 2, 177.3], [153, "Deebo Samuel", "WR", "SF", 0, 2, 130.0], [154, "Jordan Love", "QB", "GB", 0, 2, 156.9], [155, "AJ Barner", "TE", "SEA", 0, 2, 174.1], [156, "Kenny Gainwell", "RB", "TB", 0, 2, 107.3], [157, "KC Concepcion", "WR", "CLE", 0, 2, 113.0], [158, "Blake Corum", "RB", "LAR", 0, 2, 93.5], [159, "Stefon Diggs", "WR", "WAS", 0, 2, 118.7], [160, "RJ Harvey", "RB", "DEN", 0, 2, 80.4], [161, "Baker Mayfield", "QB", "TB", 0, 2, 151.2], [162, "Kyler Murray", "QB", "MIN", 0, 2, 152.4], [163, "Chris Rodriguez", "RB", "JAX", 0, 2, 140.2], [164, "Tyler Shough", "QB", "NO", 0, 2, 170.5], [165, "Aaron Jones", "RB", "MIN", 0, 2, 107.8], [166, "Jacory Croskey-Merritt", "RB", "WAS", 0, 2, 98.6], [167, "Rashid Shaheed", "WR", "SEA", 0, 2, 150.6], [168, "Rachaad White", "RB", "WAS", 0, 2, 115.6], [169, "Denzel Boston", "WR", "CLE", 0, 2, 158.5], [170, "Jalen Nailor", "WR", "LV", 0, 2, 166.6], [171, "Malik Washington", "WR", "MIA", 0, 2, 206.6], [172, "Jalen McMillan", "WR", "TB", 0, 2, 196.0], [173, "Tyrone Tracy", "RB", "NYG", 0, 2, 127.1], [174, "Tyjae Spears", "RB", "TEN", 0, 2, 167.7], [175, "Keaton Mitchell", "RB", "LAC", 0, 2, 163.9], [176, "Dylan Sampson", "RB", "CLE", 0, 2, 178.8], [177, "Woody Marks", "RB", "HOU", 0, 2, 148.9], [178, "Tyler Allgeier", "RB", "ARI", 0, 2, 129.1], [179, "Brian Robinson", "RB", "ATL", 0, 2, 161.8], [180, "Samaje Perine", "RB", "CIN", 0, 2, 622.2]];

  /* ================= STATE ================= */
  const drafted = new Set(JSON.parse(localStorage.getItem("fda_drafted") || "[]"));
  const myPicks = new Set(JSON.parse(localStorage.getItem("fda_mypicks") || "[]"));
  let mySlot = parseInt(localStorage.getItem("fda_slot") || "0", 10); // 1-10, 0 = unset
  const save = () => {
    localStorage.setItem("fda_drafted", JSON.stringify([...drafted]));
    localStorage.setItem("fda_mypicks", JSON.stringify([...myPicks]));
    localStorage.setItem("fda_slot", String(mySlot));
  };

  const available = () => BOARD.filter((p) => !drafted.has(p[1]));

  /* Snake draft math: overall pick numbers I own */
  function myOverallPicks(slot) {
    const picks = [];
    for (let r = 1; r <= ROUNDS; r++) {
      picks.push(r % 2 === 1 ? (r - 1) * TEAMS + slot : r * TEAMS - slot + 1);
    }
    return picks;
  }

  function nextMyPick() {
    if (!mySlot) return null;
    const taken = drafted.size;
    return myOverallPicks(mySlot).find((n) => n > taken) ?? null;
  }

  /* Availability odds: P(player still there at my next pick).
     Logistic on gap between player's ADP and my next overall pick. */
  function availOdds(adp) {
    const next = nextMyPick();
    if (!next) return null;
    const gap = next - adp;
    return Math.round(100 / (1 + Math.exp(-gap / 3.5)));
  }

  /* Position counting for my roster (flex-eligible overflow counts) */
  function myPosCount(pos) {
    return BOARD.filter((p) => myPicks.has(p[1]) && p[2] === pos).length;
  }

  function needScore(pos) {
    return Math.max(0, (ROSTER_TARGETS[pos] ?? 0) - myPosCount(pos));
  }

  /* Recommendation score: rank, boosted if position needed, penalized K/DEF early */
  function recScore(p, pickNum) {
    const [rank, , pos] = [p[0], p[1], p[2]];
    let s = 1000 - rank * 6;
    if (needScore(pos) > 0) s += 25;
    if ((pos === "K" || pos === "DEF") && pickNum && pickNum <= (ROUNDS - 2) * TEAMS) s -= 500;
    if (pos === "QB" && myPosCount("QB") >= 1 && pickNum && pickNum < 80) s -= 40;
    if (pos === "TE" && myPosCount("TE") >= 1 && pickNum && pickNum < 60) s -= 30;
    return s;
  }

  /* ================= UI ================= */
  const panel = document.createElement("div");
  panel.id = "fda-panel";
  panel.innerHTML = `
    <div id="fda-header">
      <strong>Draft Assistant</strong>
      <span id="fda-count"></span>
      <button id="fda-min">–</button>
    </div>
    <div id="fda-body">
      <div id="fda-slotrow">My draft slot:
        <select id="fda-slot"><option value="0">set me</option></select>
        <span id="fda-next"></span>
      </div>
      <div id="fda-rec"></div>
      <div id="fda-needs"></div>
      <table id="fda-table">
        <thead><tr><th>#</th><th>Player</th><th>Pos</th><th>Bye</th><th>Avail%</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
      <div id="fda-actions">
        <button id="fda-undo">Undo</button>
        <button id="fda-reset">Reset</button>
      </div>
    </div>`;
  document.body.appendChild(panel);

  const style = document.createElement("style");
  style.textContent = `
    #fda-panel { position: fixed; top: 80px; right: 16px; width: 320px; z-index: 99999;
      background: #1b1f24; color: #eee; border: 1px solid #444; border-radius: 8px;
      font: 13px/1.4 -apple-system, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,.5); }
    #fda-header { display: flex; justify-content: space-between; align-items: center;
      padding: 8px 10px; cursor: move; background: #262b33; border-radius: 8px 8px 0 0; }
    #fda-header button { background: none; border: none; color: #eee; font-size: 16px; cursor: pointer; }
    #fda-count, #fda-next { font-size: 11px; color: #9ab; }
    #fda-body { max-height: 62vh; overflow-y: auto; padding: 6px; }
    #fda-body.fda-hidden { display: none; }
    #fda-slotrow { padding: 2px 4px 6px; font-size: 12px; color: #9ab; }
    #fda-slot { background: #2d333b; color: #eee; border: 1px solid #555; border-radius: 4px; }
    #fda-rec { padding: 6px; margin: 2px 4px 6px; background: #1e3a24; border: 1px solid #2e7d43;
      border-radius: 6px; font-weight: 600; font-size: 13px; }
    #fda-rec small { display: block; font-weight: 400; color: #9cb; }
    #fda-needs { padding: 2px 6px 6px; font-size: 11px; color: #b8c; }
    #fda-table { width: 100%; border-collapse: collapse; }
    #fda-table th { text-align: left; color: #89a; font-size: 11px; padding: 2px 4px; }
    #fda-table td { padding: 3px 4px; border-top: 1px solid #2c333c; }
    #fda-table tr.fda-need { background: #24311f; }
    #fda-table tr.fda-top { background: #1e3a24; }
    .fda-odds-hi { color: #6f6; } .fda-odds-md { color: #fc6; } .fda-odds-lo { color: #f66; }
    #fda-table .fda-btn { font-size: 10px; cursor: pointer; border: 1px solid #555;
      border-radius: 4px; background: #333; color: #ddd; padding: 1px 5px; margin-right: 3px; }
    #fda-actions { display: flex; gap: 6px; padding: 8px 4px; }
    #fda-actions button { flex: 1; background: #2d333b; color: #ddd; border: 1px solid #555;
      border-radius: 5px; padding: 4px; cursor: pointer; font-size: 11px; }`;
  document.head.appendChild(style);

  const slotSel = panel.querySelector("#fda-slot");
  for (let i = 1; i <= TEAMS; i++) {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = `Pick ${i}`;
    slotSel.appendChild(o);
  }
  slotSel.value = String(mySlot);
  slotSel.addEventListener("change", () => {
    mySlot = parseInt(slotSel.value, 10);
    save();
    render();
  });

  /* ================= RENDER ================= */
  function render() {
    const tbody = panel.querySelector("#fda-table tbody");
    const avail = available();
    const next = nextMyPick();

    const ranked = avail
      .map((p) => ({ p, s: recScore(p, next) }))
      .sort((a, b) => b.s - a.s);
    const rec = ranked[0]?.p;
    const rec2 = ranked[1]?.p;

    panel.querySelector("#fda-rec").innerHTML = rec
      ? `▶ Suggested: ${rec[1]} (${rec[2]}, ${rec[3]})` +
        (rec2 ? `<small>backup: ${rec2[1]} (${rec2[2]})</small>` : "")
      : "▶ Board empty";

    panel.querySelector("#fda-next").textContent = next
      ? `· you pick @ #${next}`
      : "";

    const needs = Object.keys(ROSTER_TARGETS)
      .map((pos) => (needScore(pos) > 0 ? `${pos}:${needScore(pos)}` : null))
      .filter(Boolean)
      .join("  ");
    panel.querySelector("#fda-needs").textContent = needs
      ? `Needs → ${needs}`
      : "Roster targets filled";
    panel.querySelector("#fda-count").textContent =
      `${drafted.size} drafted · ${myPicks.size} mine`;

    tbody.innerHTML = avail
      .slice(0, 18)
      .map((p) => {
        const [rank, name, pos, team, bye, , adp] = p;
        const odds = availOdds(adp);
        const oddsTxt = odds === null ? "—" : odds + "%";
        const oddsCls =
          odds === null ? "" : odds >= 70 ? "fda-odds-hi" : odds >= 40 ? "fda-odds-md" : "fda-odds-lo";
        const rowCls = rec && name === rec[1] ? ' class="fda-top"' : needScore(pos) > 0 ? ' class="fda-need"' : "";
        return `<tr${rowCls}>
          <td>${rank}</td><td>${name} <span style="color:#789">${team}</span></td>
          <td>${pos}</td><td>${bye}</td>
          <td class="${oddsCls}">${oddsTxt}</td>
          <td><button class="fda-btn" data-name="${name}" data-mine="1">me</button><button class="fda-btn" data-name="${name}" data-mine="0">gone</button></td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll(".fda-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        drafted.add(btn.dataset.name);
        if (btn.dataset.mine === "1") myPicks.add(btn.dataset.name);
        save();
        render();
      })
    );
  }

  /* ================= CONTROLS ================= */
  panel.querySelector("#fda-undo").addEventListener("click", () => {
    const last = [...drafted].pop();
    if (last) {
      drafted.delete(last);
      myPicks.delete(last);
      save();
      render();
    }
  });
  panel.querySelector("#fda-reset").addEventListener("click", () => {
    if (confirm("Clear all draft tracking?")) {
      drafted.clear();
      myPicks.clear();
      save();
      render();
    }
  });
  panel.querySelector("#fda-min").addEventListener("click", () =>
    panel.querySelector("#fda-body").classList.toggle("fda-hidden")
  );

  const header = panel.querySelector("#fda-header");
  header.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON" || e.target.tagName === "SELECT") return;
    const dx = e.clientX - panel.offsetLeft;
    const dy = e.clientY - panel.offsetTop;
    const move = (ev) => {
      panel.style.left = ev.clientX - dx + "px";
      panel.style.top = ev.clientY - dy + "px";
      panel.style.right = "auto";
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });

  render();
})();
