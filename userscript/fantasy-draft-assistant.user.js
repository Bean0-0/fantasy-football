// ==UserScript==
// @name         Yahoo Fantasy Draft Assistant
// @namespace    https://github.com/Bean0-0/fantasy-football
// @version      0.1.0
// @description  Live draft assistant overlay for Yahoo Fantasy Football draft room
// @match        https://football.fantasysports.yahoo.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  /* ============================================================
   * RANKINGS — replace with current rankings before draft day.
   * Format: [rank, name, position, team, byeWeek, tier]
   * Generic PPR flavor below as placeholder.
   * ============================================================ */
  const RANKINGS = [
    [1, "Ja'Marr Chase", "WR", "CIN", 12, 1],
    [2, "Bijan Robinson", "RB", "ATL", 12, 1],
    [3, "Saquon Barkley", "RB", "PHI", 5, 1],
    [4, "Justin Jefferson", "WR", "MIN", 6, 1],
    [5, "Jahmyr Gibbs", "RB", "DET", 5, 1],
    [6, "CeeDee Lamb", "WR", "DAL", 7, 1],
    [7, "Puka Nacua", "WR", "LAR", 6, 1],
    [8, "Christian McCaffrey", "RB", "SF", 9, 1],
    [9, "Malik Nabers", "WR", "NYG", 11, 1],
    [10, "Amon-Ra St. Brown", "WR", "DET", 5, 1],
    [11, "Ashton Jeanty", "RB", "LV", 10, 2],
    [12, "Brian Thomas Jr.", "WR", "JAX", 8, 2],
    [13, "Derrick Henry", "RB", "BAL", 14, 2],
    [14, "Nico Collins", "WR", "HOU", 8, 2],
    [15, "Drake London", "WR", "ATL", 12, 2],
    [16, "Josh Jacobs", "RB", "GB", 5, 2],
    [17, "A.J. Brown", "WR", "PHI", 5, 2],
    [18, "Brock Bowers", "TE", "LV", 10, 2],
    [19, "De'Von Achane", "RB", "MIA", 6, 2],
    [20, "Ladd McConkey", "WR", "LAC", 5, 2],
    [21, "Jonathan Taylor", "RB", "IND", 12, 2],
    [22, "Tyreek Hill", "WR", "MIA", 6, 3],
    [23, "Trey McBride", "TE", "ARI", 9, 3],
    [24, "Kyren Williams", "RB", "LAR", 6, 3],
    [25, "Jaxon Smith-Njigba", "WR", "SEA", 9, 3],
    [26, "Tee Higgins", "WR", "CIN", 12, 3],
    [27, "Josh Allen", "QB", "BUF", 12, 3],
    [28, "Lamar Jackson", "QB", "BAL", 14, 3],
    [29, "Breece Hall", "RB", "NYJ", 12, 3],
    [30, "Davante Adams", "WR", "LAR", 6, 3],
    [31, "Chase Brown", "RB", "CIN", 12, 3],
    [32, "Mike Evans", "WR", "TB", 11, 3],
    [33, "Jayden Daniels", "QB", "WAS", 14, 3],
    [34, "James Cook", "RB", "BUF", 12, 3],
    [35, "Terry McLaurin", "WR", "WAS", 14, 3],
    [36, "Bucky Irving", "RB", "TB", 11, 3],
    [37, "Garrett Wilson", "WR", "NYJ", 12, 3],
    [38, "Courtland Sutton", "WR", "DEN", 14, 3],
    [39, "Kenneth Walker III", "RB", "SEA", 9, 4],
    [40, "Marvin Harrison Jr.", "WR", "ARI", 9, 4],
  ];

  // Roster targets (standard Yahoo default; tweak to match league settings)
  const ROSTER_TARGETS = { QB: 1, RB: 3, WR: 4, TE: 1, K: 1, DEF: 1 };

  /* ================= STATE ================= */
  const drafted = new Set(JSON.parse(localStorage.getItem("fda_drafted") || "[]"));
  const myPicks = new Set(JSON.parse(localStorage.getItem("fda_mypicks") || "[]"));
  const save = () => {
    localStorage.setItem("fda_drafted", JSON.stringify([...drafted]));
    localStorage.setItem("fda_mypicks", JSON.stringify([...myPicks]));
  };

  const available = () => RANKINGS.filter((p) => !drafted.has(p[1]));

  const needScore = (pos) => {
    const have = RANKINGS.filter((p) => myPicks.has(p[1]) && p[2] === pos).length;
    const want = ROSTER_TARGETS[pos] ?? 0;
    return Math.max(0, want - have);
  };

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
      <div id="fda-needs"></div>
      <table id="fda-table">
        <thead><tr><th>#</th><th>Player</th><th>Pos</th><th>Bye</th><th>T</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
      <div id="fda-actions">
        <button id="fda-undo">Undo last</button>
        <button id="fda-reset">Reset</button>
      </div>
    </div>`;
  document.body.appendChild(panel);

  const style = document.createElement("style");
  style.textContent = `
    #fda-panel { position: fixed; top: 80px; right: 16px; width: 290px; z-index: 99999;
      background: #1b1f24; color: #eee; border: 1px solid #444; border-radius: 8px;
      font: 13px/1.4 -apple-system, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,.5); }
    #fda-header { display: flex; justify-content: space-between; align-items: center;
      padding: 8px 10px; cursor: move; background: #262b33; border-radius: 8px 8px 0 0; }
    #fda-header button { background: none; border: none; color: #eee; font-size: 16px; cursor: pointer; }
    #fda-count { font-size: 11px; color: #9ab; }
    #fda-body { max-height: 60vh; overflow-y: auto; padding: 6px; }
    #fda-body.fda-hidden { display: none; }
    #fda-table { width: 100%; border-collapse: collapse; }
    #fda-table th { text-align: left; color: #89a; font-size: 11px; padding: 2px 4px; }
    #fda-table td { padding: 3px 4px; border-top: 1px solid #2c333c; }
    #fda-table tr.fda-need { background: #24311f; }
    #fda-table .fda-btn { font-size: 10px; cursor: pointer; border: 1px solid #555;
      border-radius: 4px; background: #333; color: #ddd; padding: 1px 5px; margin-right: 3px; }
    #fda-needs { padding: 4px 6px; font-size: 11px; color: #b8c; }
    #fda-actions { display: flex; gap: 6px; padding: 8px 4px; }
    #fda-actions button { flex: 1; background: #2d333b; color: #ddd; border: 1px solid #555;
      border-radius: 5px; padding: 4px; cursor: pointer; font-size: 11px; }`;
  document.head.appendChild(style);

  /* ================= RENDER ================= */
  function render() {
    const tbody = panel.querySelector("#fda-table tbody");
    const top = available().slice(0, 15);
    tbody.innerHTML = top
      .map(([rank, name, pos, team, bye, tier]) => {
        const needed = needScore(pos) > 0 ? ' class="fda-need"' : "";
        return `<tr${needed}>
          <td>${rank}</td><td>${name} <span style="color:#789">${team}</span></td>
          <td>${pos}</td><td>${bye}</td><td>${tier}</td>
          <td><button class="fda-btn" data-name="${name}" data-mine="1">me</button><button class="fda-btn" data-name="${name}" data-mine="0">gone</button></td>
        </tr>`;
      })
      .join("");

    const needs = Object.keys(ROSTER_TARGETS)
      .map((pos) => (needScore(pos) > 0 ? `${pos}:${needScore(pos)}` : null))
      .filter(Boolean)
      .join("  ");
    panel.querySelector("#fda-needs").textContent = needs
      ? `Needs → ${needs}`
      : "Roster targets filled";
    panel.querySelector("#fda-count").textContent =
      `${drafted.size} drafted · ${myPicks.size} mine`;

    tbody.querySelectorAll(".fda-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        drafted.add(name);
        if (btn.dataset.mine === "1") myPicks.add(name);
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

  // Draggable panel
  const header = panel.querySelector("#fda-header");
  header.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;
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
