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
            image_url TEXT,
            intelligence INTEGER,
            strength INTEGER,
            speed INTEGER,
            durability INTEGER,
            power INTEGER,
            combat INTEGER,
            saved_by TEXT DEFAULT '',
            is_favorite INTEGER DEFAULT 0
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
        print(
            "WARNING: No SUPERHERO_API_TOKEN found. Set the token in docker-compose.yml or as environment variable."
        )
        conn.close()
        return

    print("Seeding database with 100 heroes...")
    success_count = 0
    for hero_id in range(1, 101):
        try:
            url = f"https://www.superheroapi.com/api/{token}/{hero_id}"
            response = requests.get(url, timeout=10)
            data = response.json()

            if data.get("response") != "success":
                print(
                    f"Hero {hero_id}: API returned error - {data.get('error', 'unknown')}"
                )
                continue

            ps = data.get("powerstats", {})
            bio = data.get("biography", {})
            img = data.get("image", {})

            # Simplified stat conversion
            get_stat = lambda v: int(v) if v and v != "null" else 0

            cursor.execute(
                """
                INSERT INTO heroes (id, name, alignment, image_url, intelligence, strength, speed, durability, power, combat, saved_by, is_favorite)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 0)
            """,
                (
                    int(data.get("id", hero_id)),
                    data.get("name", f"Hero {hero_id}"),
                    bio.get("alignment"),
                    img.get("url"),
                    get_stat(ps.get("intelligence")),
                    get_stat(ps.get("strength")),
                    get_stat(ps.get("speed")),
                    get_stat(ps.get("durability")),
                    get_stat(ps.get("power")),
                    get_stat(ps.get("combat")),
                ),
            )
            success_count += 1
            if success_count % 10 == 0:
                print(f"Loaded {success_count} heroes...")
        except Exception as e:
            print(f"Failed hero {hero_id}: {e}")

    conn.commit()
    conn.close()
    print(f"Seeding complete! Added {success_count} heroes.")


@app.route("/health")
def health():
    return {"status": "ok"}


@app.route("/heroes")
def get_heroes():
    conn = get_db()
    cursor = conn.cursor()

    search = request.args.get("search", "")
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))

    # Simplified query logic
    query = "SELECT * FROM heroes"
    params = []

    if search:
        query += " WHERE name LIKE ?"
        params.append(f"%{search}%")

    query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
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


@app.route("/favorites")
def get_favorites():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM heroes WHERE is_favorite = 1")
    favorites = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(favorites)


@app.route("/favorites/<int:hero_id>", methods=["POST"])
def add_favorite(hero_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE heroes SET is_favorite = 1 WHERE id = ?", (hero_id,))
    conn.commit()
    conn.close()
    return {"status": "added"}


@app.route("/favorites/<int:hero_id>", methods=["DELETE"])
def remove_favorite(hero_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE heroes SET is_favorite = 0 WHERE id = ?", (hero_id,))
    conn.commit()
    conn.close()
    return {"status": "removed"}


# Simplified team recommendation helpers
def get_random_sample(heroes, count):
    return random.sample(heroes, min(count, len(heroes)))


def filter_by_alignment(heroes, alignment):
    return [h for h in heroes if h.get("alignment") == alignment]


@app.route("/teams/recommend")
def recommend_team():
    strategy = request.args.get("strategy", "balanced")
    stat = request.args.get("stat", "intelligence")
    size = int(request.args.get("size", 5))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM heroes")
    all_heroes = [dict(row) for row in cursor.fetchall()]
    conn.close()

    if not all_heroes:
        return {"error": "No heroes available"}, 404

    # Random strategy
    if strategy == "random":
        team = get_random_sample(all_heroes, size)
        return {
            "strategy": "random",
            "team_size": len(team),
            "reason": "Random mix for fun.",
            "heroes": team,
        }

    # Power-based strategy
    if strategy == "power":
        valid_stats = [
            "intelligence",
            "strength",
            "speed",
            "durability",
            "power",
            "combat",
        ]
        if stat not in valid_stats:
            return {"error": f"Stat must be one of {valid_stats}"}, 400

        team = sorted(all_heroes, key=lambda h: h.get(stat, 0), reverse=True)[:size]
        return {
            "strategy": "power",
            "stat": stat,
            "team_size": len(team),
            "reason": f"Top {stat} scores.",
            "heroes": team,
        }

    # Balanced strategy
    if strategy == "balanced":
        good = filter_by_alignment(all_heroes, "good")
        bad = filter_by_alignment(all_heroes, "bad")
        neutral = filter_by_alignment(all_heroes, "neutral")

        team = []
        team.extend(get_random_sample(good, size // 2))
        team.extend(get_random_sample(bad, size // 3))
        team.extend(get_random_sample(neutral, 1))

        # Fill remaining slots
        if len(team) < size:
            remaining = [h for h in all_heroes if h not in team]
            team.extend(get_random_sample(remaining, size - len(team)))

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
