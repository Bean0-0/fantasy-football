"""CLI for league data: standings, roster, scoreboard."""
import json
import sys

from yahoo import get, league_key


def standings():
    data = get("league/{key}/standings")
    print(json.dumps(data, indent=2))


def roster():
    # Requires your team key; teams endpoint finds your team first
    data = get("users;use_login=1/games;game_keys={key}/teams")
    print(json.dumps(data, indent=2))


def scoreboard():
    data = get("league/{key}/scoreboard")
    print(json.dumps(data, indent=2))


CMDS = {"standings": standings, "roster": roster, "scoreboard": scoreboard}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "standings"
    if cmd == "key":
        print(league_key())
        sys.exit(0)
    if cmd not in CMDS:
        sys.exit(f"Usage: python src/league.py [{'|'.join(CMDS)}|key]")
    CMDS[cmd]()
