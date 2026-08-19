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
  const BOARD = [
    [1,"Ja'Marr Chase","WR","CIN",12,1,1],[2,"Bijan Robinson","RB","ATL",12,1,2],
    [3,"Jahmyr Gibbs","RB","DET",5,1,3],[4,"Justin Jefferson","WR","MIN",6,1,4],
    [5,"Puka Nacua","WR","LAR",6,1,5],[6,"CeeDee Lamb","WR","DAL",7,1,6],
    [7,"Saquon Barkley","RB","PHI",5,1,7],[8,"Malik Nabers","WR","NYG",11,1,8],
    [9,"Amon-Ra St. Brown","WR","DET",5,1,9],[10,"Brian Thomas Jr.","WR","JAX",8,1,10],
    [11,"Christian McCaffrey","RB","SF",9,1,11],[12,"Ashton Jeanty","RB","LV",10,1,12],
    [13,"Nico Collins","WR","HOU",8,2,13],[14,"De'Von Achane","RB","MIA",6,2,14],
    [15,"Drake London","WR","ATL",12,2,15],[16,"Jonathan Taylor","RB","IND",12,2,16],
    [17,"Derrick Henry","RB","BAL",14,2,17],[18,"A.J. Brown","WR","PHI",5,2,18],
    [19,"Brock Bowers","TE","LV",10,2,19],[20,"Josh Jacobs","RB","GB",5,2,20],
    [21,"Ladd McConkey","WR","LAC",5,2,21],[22,"Kyren Williams","RB","LAR",6,2,22],
    [23,"Trey McBride","TE","ARI",9,2,23],[24,"Jaxon Smith-Njigba","WR","SEA",9,2,24],
    [25,"Breece Hall","RB","NYJ",12,2,25],[26,"Tee Higgins","WR","CIN",12,2,26],
    [27,"Chase Brown","RB","CIN",12,2,27],[28,"Mike Evans","WR","TB",11,3,28],
    [29,"Bucky Irving","RB","TB",11,3,29],[30,"Garrett Wilson","WR","NYJ",12,3,30],
    [31,"Josh Allen","QB","BUF",12,3,31],[32,"Lamar Jackson","QB","BAL",14,3,32],
    [33,"James Cook","RB","BUF",12,3,33],[34,"Terry McLaurin","WR","WAS",14,3,34],
    [35,"Courtland Sutton","WR","DEN",14,3,35],[36,"Kenneth Walker III","RB","SEA",9,3,36],
    [37,"Marvin Harrison Jr.","WR","ARI",9,3,37],[38,"Jayden Daniels","QB","WAS",14,3,38],
    [39,"Davante Adams","WR","LAR",6,3,39],[40,"Alvin Kamara","RB","NO",11,3,40],
    [41,"Tyreek Hill","WR","MIA",6,3,41],[42,"Joe Burrow","QB","CIN",12,4,42],
    [43,"TreVeyon Henderson","RB","NE",13,4,43],[44,"Emeka Egbuka","WR","TB",11,4,44],
    [45,"Rhamondre Stevenson","RB","NE",13,4,45],[46,"DK Metcalf","WR","PIT",6,4,46],
    [47,"Sam LaPorta","TE","DET",5,4,47],[48,"Jalen Hurts","QB","PHI",5,4,48],
    [49,"Omarion Hampton","RB","LAC",5,4,49],[50,"Rashee Rice","WR","KC",9,4,50],
    [51,"Javonte Williams","RB","DAL",7,4,51],[52,"Chris Olave","WR","NO",11,4,52],
    [53,"D.J. Moore","WR","CHI",7,4,53],[54,"James Conner","RB","ARI",9,4,54],
    [55,"Baker Mayfield","QB","TB",11,5,55],[56,"George Kittle","TE","SF",9,5,56],
    [57,"Tetairoa McMillan","WR","CAR",6,5,57],[58,"David Montgomery","RB","DET",5,5,58],
    [59,"Zay Flowers","WR","BAL",14,5,59],[60,"Bo Nix","QB","DEN",14,5,60],
    [61,"Tony Pollard","RB","TEN",8,5,61],[62,"Rome Odunze","WR","CHI",7,5,62],
    [63,"T.J. Hockenson","TE","MIN",6,5,63],[64,"Dak Prescott","QB","DAL",7,6,64],
    [65,"Travis Etienne Jr.","RB","JAX",8,6,65],[66,"Jaylen Waddle","WR","MIA",6,6,66],
    [67,"D'Andre Swift","RB","CHI",7,6,67],[68,"Calvin Ridley","WR","TEN",8,6,68],
    [69,"Mark Andrews","TE","BAL",14,6,69],[70,"Jordan Love","QB","GB",5,6,70],
    [71,"Isiah Pacheco","RB","KC",9,6,71],[72,"Jakobi Meyers","WR","LV",10,6,72],
    [73,"Aaron Jones Sr.","RB","MIN",6,7,73],[74,"Jerry Jeudy","WR","CLE",10,7,74],
    [75,"Evan Engram","TE","DEN",14,7,75],[76,"Matthew Stafford","QB","LAR",6,7,76],
    [77,"Tyjae Spears","RB","TEN",8,7,77],[78,"Michael Pittman Jr.","WR","IND",12,7,78],
    [79,"Khalil Shakir","WR","BUF",12,7,79],[80,"Patrick Mahomes","QB","KC",9,8,80],
    [81,"Zach Charbonnet","RB","SEA",9,8,81],[82,"Deebo Samuel Sr.","WR","WAS",14,8,82],
    [83,"Dalton Kincaid","TE","BUF",12,8,83],[84,"Rachaad White","RB","TB",11,8,84],
    [85,"Jauan Jennings","WR","SF",9,8,85],[86,"Brock Purdy","QB","SF",9,8,86],
    [87,"Jaylen Warren","RB","PIT",6,8,87],[88,"Keenan Allen","WR","LAC",5,9,88],
    [89,"Kyle Pitts Sr.","TE","ATL",12,9,89],[90,"Austin Ekeler","RB","WAS",14,9,90],
    [91,"Stefon Diggs","WR","NE",13,9,91],[92,"Jared Goff","QB","DET",5,9,92],
    [93,"David Njoku","TE","CLE",10,9,93],[94,"Tank Bigsby","RB","JAX",8,9,94],
    [95,"Ricky Pearsall","WR","SF",9,9,95],[96,"Trevor Lawrence","QB","JAX",8,10,96],
    [97,"Tyler Warren","TE","IND",12,10,97],[98,"Jordan Mason","RB","MIN",6,10,98],
    [99,"Marvin Mims Sr.","WR","DEN",14,10,99],[100,"C.J. Stroud","QB","HOU",8,10,100],
    [101,"Dallas Goedert","TE","PHI",5,10,101],[102,"Najee Harris","RB","LAC",5,10,102],
    [103,"Josh Downs","WR","IND",12,10,103],[104,"Brandon Aubrey","K","DAL",7,15,135],
    [105,"Cameron Dicker","K","LAC",5,15,138],[106,"Jake Bates","K","DET",5,15,140],
    [107,"Chase McLaughlin","K","TB",11,15,142],[108,"Wil Lutz","K","DEN",14,15,144],
    [109,"Ka'imi Fairbairn","K","HOU",8,15,146],[110,"Jake Elliott","K","PHI",5,15,148],
    [111,"Harrison Butker","K","KC",9,15,150],[112,"Chris Boswell","K","PIT",6,15,152],
    [113,"Tyler Loop","K","BAL",14,15,154],[114,"Broncos DST","DEF","DEN",14,16,136],
    [115,"Ravens DST","DEF","BAL",14,16,139],[116,"Bills DST","DEF","BUF",12,16,141],
    [117,"Lions DST","DEF","DET",5,16,143],[118,"Eagles DST","DEF","PHI",5,16,145],
    [119,"Steelers DST","DEF","PIT",6,16,147],[120,"49ers DST","DEF","SF",9,16,149],
    [121,"Vikings DST","DEF","MIN",6,16,151],[122,"Chiefs DST","DEF","KC",9,16,153],
    [123,"Packers DST","DEF","GB",5,16,155],
  ];

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
