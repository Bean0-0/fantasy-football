"""Yahoo OAuth2 flow. Saves refreshable token to token.json."""
import json
import os
import sys

from dotenv import load_dotenv
from requests_oauthlib import OAuth2Session

load_dotenv()

AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth"
TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token"
TOKEN_FILE = "token.json"


def main():
    client_id = os.getenv("YAHOO_CLIENT_ID")
    client_secret = os.getenv("YAHOO_CLIENT_SECRET")
    redirect_uri = os.getenv("YAHOO_REDIRECT_URI", "oob")
    if not client_id or not client_secret:
        sys.exit("Set YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET in .env")

    oauth = OAuth2Session(client_id, redirect_uri=redirect_uri)
    auth_url, _ = oauth.authorization_url(AUTH_URL)
    print(f"Open this URL in your browser:\n\n{auth_url}\n")
    code = input("Paste the code Yahoo gives you: ").strip()

    token = oauth.fetch_token(
        TOKEN_URL,
        code=code,
        client_secret=client_secret,
    )
    with open(TOKEN_FILE, "w") as f:
        json.dump(token, f, indent=2)
    print(f"Token saved to {TOKEN_FILE}")


if __name__ == "__main__":
    main()
