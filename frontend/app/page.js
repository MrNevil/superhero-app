"use client";

import { useEffect, useState } from "react";
import HeroCard from "../components/HeroCard";
import HeroModal from "../components/HeroModal";
import { apiDelete, apiGet, apiPost } from "../lib/api";

export default function HomePage() {
  // State for heroes data
  const [heroes, setHeroes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedHeroId, setSelectedHeroId] = useState(null);
  
  // State for team recommendations
  const [team, setTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [strategy, setStrategy] = useState("balanced");
  const [power, setPower] = useState("intelligence");

  // Load heroes and favorites on page load
  useEffect(() => {
    const loadData = async () => {
      try {
        const heroesData = await apiGet("/heroes?limit=200");
        setHeroes(heroesData);
      } catch (error) {
        console.error("Failed to load heroes", error);
      }

      try {
        const favoritesData = await apiGet("/favorites");
        setFavorites(favoritesData);
      } catch (error) {
        console.error("Failed to load favorites", error);
      }
    };

    loadData();
  }, []);

  // Check if a hero is in favorites
  const isFavorite = (heroId) => {
    return favorites.some((fav) => fav.id === heroId);
  };

  // Filter heroes based on search
  const displayedHeroes = heroes.filter((hero) => {
    if (!search.trim()) return true;
    return hero.name.toLowerCase().includes(search.toLowerCase());
  });

  // Add or remove a hero from favorites
  const toggleFavorite = async (hero) => {
    try {
      if (isFavorite(hero.id)) {
        // Remove from favorites
        await apiDelete(`/favorites/${hero.id}`);
        setFavorites(favorites.filter((fav) => fav.id !== hero.id));
      } else {
        // Add to favorites
        await apiPost(`/favorites/${hero.id}`);
        setFavorites([...favorites, hero]);
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  // Request a team recommendation
  const requestTeam = async () => {
    try {
      setTeamLoading(true);
      setTeam(null);
      const params = new URLSearchParams({ strategy });
      if (strategy === "power") {
        params.set("stat", power);
      }
      const data = await apiGet(`/teams/recommend?${params.toString()}`);
      setTeam(data);
    } catch (error) {
      console.error("Failed to get team", error);
    } finally {
      setTeamLoading(false);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="hero">
        <div>
          <p className="eyebrow">Hero Atlas</p>
          <h1>Build your dream squad.</h1>
          <p className="lead">
            Explore {heroes.length} iconic heroes, save your favorites, and view
            detailed stats.
          </p>
        </div>
        <div className="hero-card">
          <p className="label">Your Collection</p>
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

      {/* Team Recommendations Section */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Team recommendations</h2>
            <p className="muted">Pick a strategy and generate your perfect team.</p>
          </div>
          <div className="controls">
            <label>
              Strategy
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
              >
                <option value="balanced">Balanced</option>
                <option value="power">Power focus</option>
                <option value="random">Random</option>
              </select>
            </label>
            {strategy === "power" && (
              <label>
                Power
                <select value={power} onChange={(e) => setPower(e.target.value)}>
                  <option value="intelligence">intelligence</option>
                  <option value="strength">strength</option>
                  <option value="speed">speed</option>
                  <option value="durability">durability</option>
                  <option value="power">power</option>
                  <option value="combat">combat</option>
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
                isFavorite={isFavorite(hero.id)}
                onToggleFavorite={() => toggleFavorite(hero)}
                onClick={() => setSelectedHeroId(hero.id)}
              />
            ))
          ) : (
            <p className="muted">No team yet. Click "Get team" to start.</p>
          )}
        </div>
        {team?.reason && <p className="reason">{team.reason}</p>}
      </section>

      {/* Search and All Heroes Section */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>All heroes</h2>
            <p className="muted">Click a card to view full details.</p>
          </div>
          <label className="search">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try Batman"
            />
          </label>
        </div>
        <div className="grid">
          {displayedHeroes.length ? (
            displayedHeroes.map((hero) => (
              <HeroCard
                key={hero.id}
                hero={hero}
                isFavorite={isFavorite(hero.id)}
                onToggleFavorite={() => toggleFavorite(hero)}
                onClick={() => setSelectedHeroId(hero.id)}
              />
            ))
          ) : (
            <p className="muted">No heroes found. Try a different search.</p>
          )}
        </div>
      </section>

      {/* Favorites Section */}
      <section className="panel">
        <div className="panel-header">
          <h2>Favorites</h2>
          <p className="muted">Your personal collection of heroes.</p>
        </div>
        <div className="grid">
          {favorites.length ? (
            favorites.map((hero) => (
              <HeroCard
                key={hero.id}
                hero={hero}
                isFavorite
                onToggleFavorite={() => toggleFavorite(hero)}
                onClick={() => setSelectedHeroId(hero.id)}
              />
            ))
          ) : (
            <p className="muted">No favorites yet. Click the heart icon to save heroes.</p>
          )}
        </div>
      </section>

      {/* Hero Details Modal */}
      <HeroModal
        heroId={selectedHeroId}
        onClose={() => setSelectedHeroId(null)}
        isFavorite={selectedHeroId ? isFavorite(selectedHeroId) : false}
        onToggleFavorite={selectedHeroId ? () => {
          const hero = heroes.find(h => h.id === selectedHeroId);
          if (hero) toggleFavorite(hero);
        } : null}
      />
    </div>
  );
}
