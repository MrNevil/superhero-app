from typing import Optional
from sqlmodel import SQLModel, Field


class Hero(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    alignment: Optional[str] = None
    publisher: Optional[str] = None
    full_name: Optional[str] = None
    gender: Optional[str] = None
    race: Optional[str] = None
    image_url: Optional[str] = None
    intelligence: Optional[int] = None
    strength: Optional[int] = None
    speed: Optional[int] = None
    durability: Optional[int] = None
    power: Optional[int] = None
    combat: Optional[int] = None


class Favorite(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    client_id: str = Field(index=True)
    hero_id: int = Field(foreign_key="hero.id", index=True)
