# Draft Tool Research — What to Mimic

Research date: 2026-08-19. Sources: web search on leading tools.

## Tools surveyed

| Tool | Killer feature | Worth mimicking |
|---|---|---|
| **Draft Punk** | "Prediction Odds" — % chance player still available at your next pick. Simulates hundreds of board states over next 2 rounds. <40% = draft now, >70% = safe to wait | ✅ HIGH — we can compute from ADP vs current pick gap |
| **PFF Live Draft Assistant** | Syncs Yahoo/ESPN/Sleeper, auto-imports league scoring/roster, strategy modes (Zero RB, stacks), availability forecasts | ✅ League-settings import via Yahoo API we already have |
| **FantasyPros Draft Wizard** | Live draft sync via Chrome extension, cheat sheets, expert consensus rankings (ECR) | ✅ ECR = free aggregated rankings to power our board |
| **4for4 Draft Hero** | Browser extension auto-crosses players off as drafted | ✅ Our MutationObserver auto-detect goal |
| **DraftKick** | Live value metric (SGP), keeper/auction support | VORP simpler version of same idea |
| **Sticktothemodel / VORP Vision** | VORP-based big board, Chrome overlay on draft | ✅ VORP column = upgrade over raw rank |

## Features to build (priority order)

1. **VORP scoring** — value over replacement player per position. Better than raw rank.
   Formula: `proj_points(player) - proj_points(replacement at position)`.
   Replacement = first player at position likely undrafted (e.g. RB24 in 10-team).
2. **Availability odds** (mimic Draft Punk) — probability player survives to your
   next pick. Cheap version: `f(adp_gap, picks_until_mine, position demand)`.
   Show % next to name. Green = safe to wait, red = take now.
3. **Auto pick detection** (mimic Draft Hero / DraftKick extensions) —
   MutationObserver on Yahoo draft log, cross off automatically.
4. **League settings import** (mimic PFF) — Yahoo API already scaffolded in
   `src/`; pull scoring + roster slots to tune VORP + targets.
5. **ECR rankings** — FantasyPros publishes free consensus ranks; fetch +
   embed as JSON before draft day.
6. **Strategy mode toggle** — Zero RB / Robust RB / Hero RB — changes
   positional need weighting.

## Not worth mimicking

- Auction support (unless league is auction — check settings)
- Mock draft simulator (plenty free ones exist; practice on theirs)
