import os
import sqlite3
import random
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = "data/heroes.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS heroes (
            id INTEGER PRIMARY KEY,
            name TEXT,
            alignment TEXT,
            publisher TEXT,
            full_name TEXT,
            gender TEXT,
            race TEXT,
            image_url TEXT,
            intelligence INTEGER,
            strength INTEGER,
            speed INTEGER,
            durability INTEGER,
            power INTEGER,
            combat INTEGER
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id TEXT,
            hero_id INTEGER
        )
    """)

    conn.commit()
    conn.close()


def seed_heroes():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM heroes")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    token = os.getenv("SUPERHERO_API_TOKEN")
    if not token:
        conn.close()
        return

    print("Seeding database...")
    for hero_id in range(1, 101):
        try:
            url = f"https://www.superheroapi.com/api/{token}/{hero_id}"
            response = requests.get(url, timeout=10)
            data = response.json()

            if data.get("response") != "success":
                continue

            ps = data.get("powerstats", {})
            bio = data.get("biography", {})
            app_data = data.get("appearance", {})
            img = data.get("image", {})

            cursor.execute(
                """
                INSERT INTO heroes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    int(data.get("id", hero_id)),
                    data.get("name", f"Hero {hero_id}"),
                    bio.get("alignment"),
                    bio.get("publisher"),
                    bio.get("full-name"),
                    app_data.get("gender"),
                    app_data.get("race"),
                    img.get("url"),
                    int(ps.get("intelligence") or 0)
                    if ps.get("intelligence") != "null"
                    else None,
                    int(ps.get("strength") or 0)
                    if ps.get("strength") != "null"
                    else None,
                    int(ps.get("speed") or 0) if ps.get("speed") != "null" else None,
                    int(ps.get("durability") or 0)
                    if ps.get("durability") != "null"
                    else None,
                    int(ps.get("power") or 0) if ps.get("power") != "null" else None,
                    int(ps.get("combat") or 0) if ps.get("combat") != "null" else None,
                ),
            )
        except Exception as e:
            print(f"Failed hero {hero_id}: {e}")
            continue

    conn.commit()
    conn.close()
    print("Seeding complete!")


@app.route("/health")
def health():
    return {"status": "ok"}


@app.route("/heroes")
def get_heroes():
    conn = get_db()
    cursor = conn.cursor()

    search = request.args.get("search", "")
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))

    if search:
        cursor.execute(
            "SELECT * FROM heroes WHERE name LIKE ? LIMIT ? OFFSET ?",
            (f"%{search}%", limit, offset),
        )
    else:
        cursor.execute("SELECT * FROM heroes LIMIT ? OFFSET ?", (limit, offset))

    heroes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(heroes)


@app.route("/heroes/<int:hero_id>")
def get_hero(hero_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM heroes WHERE id = ?", (hero_id,))
    hero = cursor.fetchone()
    conn.close()

    if not hero:
        return {"error": "Hero not found"}, 404

    return jsonify(dict(hero))


@app.route("/favorites/<client_id>")
def get_favorites(client_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT h.* FROM heroes h
        JOIN favorites f ON h.id = f.hero_id
        WHERE f.client_id = ?
    """,
        (client_id,),
    )
    favorites = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(favorites)


@app.route("/favorites/<client_id>/<int:hero_id>", methods=["POST"])
def add_favorite(client_id, hero_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM favorites WHERE client_id = ? AND hero_id = ?",
        (client_id, hero_id),
    )
    if cursor.fetchone():
        conn.close()
        return {"status": "exists"}

    cursor.execute(
        "INSERT INTO favorites (client_id, hero_id) VALUES (?, ?)", (client_id, hero_id)
    )
    conn.commit()
    conn.close()
    return {"status": "added"}


@app.route("/favorites/<client_id>/<int:hero_id>", methods=["DELETE"])
def remove_favorite(client_id, hero_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM favorites WHERE client_id = ? AND hero_id = ?",
        (client_id, hero_id),
    )
    conn.commit()
    conn.close()
    return {"status": "removed"}


@app.route("/teams/recommend")
def recommend_team():
    strategy = request.args.get("strategy", "balanced")
    power = request.args.get("power", "intelligence")
    size = int(request.args.get("size", 5))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM heroes")
    all_heroes = [dict(row) for row in cursor.fetchall()]
    conn.close()

    if not all_heroes:
        return {"error": "No heroes available"}, 404

    if strategy == "random":
        team = random.sample(all_heroes, min(size, len(all_heroes)))
        return {
            "strategy": "random",
            "team_size": len(team),
            "reason": "Random mix for fun.",
            "heroes": team,
        }

    if strategy == "power":
        valid_powers = [
            "intelligence",
            "strength",
            "speed",
            "durability",
            "power",
            "combat",
        ]
        if power not in valid_powers:
            return {"error": f"Power must be one of {valid_powers}"}, 400

        sorted_heroes = sorted(
            all_heroes, key=lambda h: h.get(power) or 0, reverse=True
        )
        team = sorted_heroes[:size]
        return {
            "strategy": "power",
            "power": power,
            "team_size": len(team),
            "reason": f"Top {power} scores.",
            "heroes": team,
        }

    if strategy == "balanced":
        good = [h for h in all_heroes if h.get("alignment") == "good"]
        bad = [h for h in all_heroes if h.get("alignment") == "bad"]
        neutral = [h for h in all_heroes if h.get("alignment") == "neutral"]

        team = []
        if good:
            team.extend(random.sample(good, min(size // 2, len(good))))
        if bad:
            team.extend(random.sample(bad, min(size // 3, len(bad))))
        if neutral:
            team.extend(random.sample(neutral, min(1, len(neutral))))

        if len(team) < size:
            remaining = [h for h in all_heroes if h not in team]
            if remaining:
                team.extend(
                    random.sample(remaining, min(size - len(team), len(remaining)))
                )

        return {
            "strategy": "balanced",
            "team_size": len(team),
            "reason": "Mix of heroes, villains, and neutrals.",
            "heroes": team,
        }

    return {"error": "Unknown strategy"}, 400


if __name__ == "__main__":
    init_db()
    seed_heroes()
    app.run(host="0.0.0.0", port=8000, debug=True)
