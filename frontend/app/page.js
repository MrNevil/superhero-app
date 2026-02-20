"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HeroCard from "../components/HeroCard";
import { apiDelete, apiGet, apiPost } from "../lib/api";
import { getClientId } from "../lib/clientId";

const POWERS = [
  "intelligence",
  "strength",
  "speed",
  "durability",
  "power",
  "combat"
];

export default function HomePage() {
  const [heroes, setHeroes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [strategy, setStrategy] = useState("balanced");
  const [power, setPower] = useState("intelligence");

  useEffect(() => {
    const id = getClientId();
    setClientId(id);

    apiGet("/heroes?limit=200")
      .then(setHeroes)
      .catch(() => setHeroes([]));

    apiGet(`/favorites/${id}`)
      .then(setFavorites)
      .catch(() => setFavorites([]));
  }, []);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((hero) => hero.id)),
    [favorites]
  );

  const filteredHeroes = useMemo(() => {
    if (!search.trim()) {
      return heroes;
    }
    const query = search.toLowerCase();
    return heroes.filter((hero) => hero.name.toLowerCase().includes(query));
  }, [heroes, search]);

  const toggleFavorite = async (hero) => {
    if (!clientId) return;

    if (favoriteIds.has(hero.id)) {
      await apiDelete(`/favorites/${clientId}/${hero.id}`);
      setFavorites((prev) => prev.filter((item) => item.id !== hero.id));
      return;
    }

    await apiPost(`/favorites/${clientId}/${hero.id}`);
    setFavorites((prev) => [...prev, hero]);
  };

  const requestTeam = async () => {
    setTeamLoading(true);
    setTeam(null);

    const params = new URLSearchParams({ strategy });
    if (strategy === "power") {
      params.set("power", power);
    }

    try {
      const data = await apiGet(`/teams/recommend?${params.toString()}`);
      setTeam(data);
    } finally {
      setTeamLoading(false);
    }
  };

  return (
    <div className="page" id="top">
      <header className="hero">
        <div>
          <p className="eyebrow">Hero Atlas</p>
          <h1>Build your dream squad.</h1>
          <p className="lead">
            Browse iconic characters, save favorites, and generate team
            recommendations in seconds.
          </p>
        </div>
        <div className="hero-card">
          <p className="label">Quick Stats</p>
          <div className="stat-grid">
            <div>
              <span className="stat">{heroes.length}</span>
              <span className="stat-label">Heroes</span>
            </div>
            <div>
              <span className="stat">{favorites.length}</span>
              <span className="stat-label">Favorites</span>
            </div>
            <div>
              <span className="stat">3</span>
              <span className="stat-label">Strategies</span>
            </div>
          </div>
          <button className="primary" onClick={requestTeam}>
            Generate a team
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Team recommendations</h2>
            <p className="muted">Mix heroes, pick power leaders, or go random.</p>
          </div>
          <div className="controls">
            <label>
              Strategy
              <select
                value={strategy}
                onChange={(event) => setStrategy(event.target.value)}
              >
                <option value="balanced">Balanced</option>
                <option value="power">Power focus</option>
                <option value="random">Random</option>
              </select>
            </label>
            {strategy === "power" && (
              <label>
                Power
                <select
                  value={power}
                  onChange={(event) => setPower(event.target.value)}
                >
                  {POWERS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="primary" onClick={requestTeam}>
              {teamLoading ? "Generating..." : "Get team"}
            </button>
          </div>
        </div>
        <div className="team-grid">
          {team?.heroes?.length ? (
            team.heroes.map((hero) => (
              <HeroCard
                key={hero.id}
                hero={hero}
                isFavorite={favoriteIds.has(hero.id)}
                onToggleFavorite={() => toggleFavorite(hero)}
              />
            ))
          ) : (
            <p className="muted">No team yet. Click "Get team" to start.</p>
          )}
        </div>
        {team?.reason && <p className="reason">{team.reason}</p>}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>All heroes</h2>
            <p className="muted">Tap a card to see full details.</p>
          </div>
          <label className="search">
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try Batman"
            />
          </label>
        </div>
        <div className="grid">
          {filteredHeroes.map((hero) => (
            <HeroCard
              key={hero.id}
              hero={hero}
              isFavorite={favoriteIds.has(hero.id)}
              onToggleFavorite={() => toggleFavorite(hero)}
              linkHref={`/hero/${hero.id}`}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Favorites</h2>
            <p className="muted">Your personal hall of fame.</p>
          </div>
          <Link className="text-link" href="#top">
            Back to top
          </Link>
        </div>
        <div className="grid">
          {favorites.length ? (
            favorites.map((hero) => (
              <HeroCard
                key={hero.id}
                hero={hero}
                isFavorite
                onToggleFavorite={() => toggleFavorite(hero)}
                linkHref={`/hero/${hero.id}`}
              />
            ))
          ) : (
            <p className="muted">No favorites yet. Tap a heart to save one.</p>
          )}
        </div>
      </section>
    </div>
  );
}
