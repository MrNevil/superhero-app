import os
import random
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from .database import init_db, get_session, engine
from .models import Hero, Favorite
from .seed import seed_db

TEAM_SIZE_DEFAULT = 5
ALLOWED_POWERS = {"intelligence", "strength", "speed", "durability", "power", "combat"}

app = FastAPI(title="Superhero Service")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin] if frontend_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    token = os.getenv("SUPERHERO_API_TOKEN")
    if token:
        with Session(engine) as session:
            seed_db(session, token, limit=100)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/heroes")
def list_heroes(
    search: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
):
    query = select(Hero)
    if search:
        query = query.where(Hero.name.contains(search))
    heroes = session.exec(query.offset(offset).limit(limit)).all()
    return heroes


@app.get("/heroes/{hero_id}")
def get_hero(hero_id: int, session: Session = Depends(get_session)):
    hero = session.get(Hero, hero_id)
    if not hero:
        raise HTTPException(status_code=404, detail="Hero not found")
    return hero


@app.get("/favorites/{client_id}")
def get_favorites(client_id: str, session: Session = Depends(get_session)):
    stmt = (
        select(Hero)
        .join(Favorite, Favorite.hero_id == Hero.id)
        .where(Favorite.client_id == client_id)
    )
    return session.exec(stmt).all()


@app.post("/favorites/{client_id}/{hero_id}")
def add_favorite(client_id: str, hero_id: int, session: Session = Depends(get_session)):
    hero = session.get(Hero, hero_id)
    if not hero:
        raise HTTPException(status_code=404, detail="Hero not found")

    existing = session.exec(
        select(Favorite)
        .where(Favorite.client_id == client_id)
        .where(Favorite.hero_id == hero_id)
    ).first()
    if existing:
        return {"status": "exists"}

    favorite = Favorite(client_id=client_id, hero_id=hero_id)
    session.add(favorite)
    session.commit()
    return {"status": "added"}


@app.delete("/favorites/{client_id}/{hero_id}")
def remove_favorite(
    client_id: str, hero_id: int, session: Session = Depends(get_session)
):
    favorite = session.exec(
        select(Favorite)
        .where(Favorite.client_id == client_id)
        .where(Favorite.hero_id == hero_id)
    ).first()
    if not favorite:
        return {"status": "missing"}

    session.delete(favorite)
    session.commit()
    return {"status": "removed"}


def _power_value(hero: Hero, power: str) -> int:
    value = getattr(hero, power, 0)
    return value or 0


def _pick_random(heroes: list[Hero], count: int) -> list[Hero]:
    if len(heroes) <= count:
        return heroes
    return random.sample(heroes, count)


@app.get("/teams/recommend")
def recommend_team(
    strategy: str = Query(default="balanced"),
    power: str | None = None,
    size: int = Query(default=TEAM_SIZE_DEFAULT, ge=3, le=10),
    session: Session = Depends(get_session),
):
    heroes = session.exec(select(Hero)).all()
    if not heroes:
        raise HTTPException(status_code=404, detail="No heroes available")

    if strategy == "random":
        team = _pick_random(heroes, size)
        return {
            "strategy": "random",
            "team_size": len(team),
            "reason": "Random mix for fun.",
            "heroes": team,
        }

    if strategy == "power":
        if not power or power not in ALLOWED_POWERS:
            raise HTTPException(
                status_code=400,
                detail=f"Power must be one of {sorted(ALLOWED_POWERS)}",
            )
        ordered = sorted(
            heroes, key=lambda hero: _power_value(hero, power), reverse=True
        )
        team = ordered[:size]
        return {
            "strategy": "power",
            "power": power,
            "team_size": len(team),
            "reason": f"Top {power} scores.",
            "heroes": team,
        }

    if strategy == "balanced":
        good = [hero for hero in heroes if hero.alignment == "good"]
        bad = [hero for hero in heroes if hero.alignment == "bad"]
        neutral = [hero for hero in heroes if hero.alignment == "neutral"]

        team = []
        team.extend(_pick_random(good, max(1, size // 2)))
        team.extend(_pick_random(bad, max(1, size // 3)))
        if neutral:
            team.extend(_pick_random(neutral, 1))

        if len(team) < size:
            remaining = [hero for hero in heroes if hero not in team]
            team.extend(_pick_random(remaining, size - len(team)))

        return {
            "strategy": "balanced",
            "team_size": len(team),
            "reason": "Mix of heroes, villains, and neutrals.",
            "heroes": team,
        }

    raise HTTPException(status_code=400, detail="Unknown strategy")
