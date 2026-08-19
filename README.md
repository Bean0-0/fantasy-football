# Fantasy Football Helper

Tools for my Yahoo Fantasy Football league.

League: https://football.fantasysports.yahoo.com/f1/1306729

## Setup

Yahoo Fantasy Sports API requires OAuth 2.0.

1. Create a Yahoo Developer app: https://developer.yahoo.com/apps/
   - Redirect URI: `https://localhost:8080` (or `oob` for out-of-band)
   - Enable **Fantasy Sports** read scope
2. Copy `.env.example` to `.env` and fill in credentials:

```bash
cp .env.example .env
```

3. Install deps:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

4. Authenticate (first run opens browser, saves token to `token.json`):

```bash
python src/auth.py
```

5. Fetch league data:

```bash
python src/league.py          # standings
python src/league.py roster   # your roster
python src/league.py scoreboard
```

## Notes

- Never commit `.env` or `token.json` (already in `.gitignore`).
- Yahoo game key changes each NFL season; set `GAME_KEY` in `.env`.
