import requests
from sqlmodel import Session, select
from .models import Hero


def _parse_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _fetch_hero(token: str, hero_id: int):
    url = f"https://www.superheroapi.com/api/{token}/{hero_id}"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    data = response.json()
    if data.get("response") != "success":
        return None
    return data


def seed_db(session: Session, token: str, limit: int = 100) -> int:
    existing = session.exec(select(Hero.id)).first()
    if existing:
        return 0

    created = 0
    for hero_id in range(1, limit + 1):
        data = _fetch_hero(token, hero_id)
        if not data:
            continue

        powerstats = data.get("powerstats", {})
        biography = data.get("biography", {})
        appearance = data.get("appearance", {})
        image = data.get("image", {})

        hero = Hero(
            id=int(data.get("id", hero_id)),
            name=data.get("name") or f"Hero {hero_id}",
            alignment=biography.get("alignment"),
            publisher=biography.get("publisher"),
            full_name=biography.get("full-name"),
            gender=appearance.get("gender"),
            race=appearance.get("race"),
            image_url=image.get("url"),
            intelligence=_parse_int(powerstats.get("intelligence")),
            strength=_parse_int(powerstats.get("strength")),
            speed=_parse_int(powerstats.get("speed")),
            durability=_parse_int(powerstats.get("durability")),
            power=_parse_int(powerstats.get("power")),
            combat=_parse_int(powerstats.get("combat")),
        )

        session.add(hero)
        created += 1

    session.commit()
    return created
