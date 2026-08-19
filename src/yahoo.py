"""Shared Yahoo Fantasy API client with token auto-refresh."""
import json
import os
import sys

from dotenv import load_dotenv
from requests_oauthlib import OAuth2Session

load_dotenv()

BASE = "https://fantasysports.yahooapis.com/fantasy/v2"
TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token"
TOKEN_FILE = "token.json"


def get_session() -> OAuth2Session:
    if not os.path.exists(TOKEN_FILE):
        sys.exit("No token.json — run: python src/auth.py")

    with open(TOKEN_FILE) as f:
        token = json.load(f)

    client_id = os.getenv("YAHOO_CLIENT_ID")
    client_secret = os.getenv("YAHOO_CLIENT_SECRET")

    def save(t):
        with open(TOKEN_FILE, "w") as f:
            json.dump(t, f, indent=2)

    session = OAuth2Session(
        client_id,
        token=token,
        auto_refresh_url=TOKEN_URL,
        auto_refresh_kwargs={"client_id": client_id, "client_secret": client_secret},
        token_updater=save,
    )
    return session


def league_key() -> str:
    return f"{os.getenv('GAME_KEY', '461')}.l.{os.getenv('LEAGUE_ID', '1306729')}"


def get(path: str) -> dict:
    """GET fantasy API path, return parsed JSON. Example path: 'league/{key}/standings'"""
    path = path.format(key=league_key())
    r = get_session().get(f"{BASE}/{path}", params={"format": "json"})
    r.raise_for_status()
    return r.json()
