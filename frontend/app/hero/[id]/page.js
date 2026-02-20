"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiDelete, apiGet, apiPost } from "../../../lib/api";
import { getClientId } from "../../../lib/clientId";

export default function HeroDetailPage() {
  const params = useParams();
  const heroId = params?.id;
  const [hero, setHero] = useState(null);
  const [clientId, setClientId] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const id = getClientId();
    setClientId(id);

    if (!heroId) return;

    apiGet(`/heroes/${heroId}`)
      .then(setHero)
      .catch(() => setHero(null));

    apiGet(`/favorites/${id}`)
      .then((data) => setIsFavorite(data.some((item) => item.id === Number(heroId))))
      .catch(() => setIsFavorite(false));
  }, [heroId]);

  const toggleFavorite = async () => {
    if (!clientId || !hero) return;
    if (isFavorite) {
      await apiDelete(`/favorites/${clientId}/${hero.id}`);
      setIsFavorite(false);
      return;
    }
    await apiPost(`/favorites/${clientId}/${hero.id}`);
    setIsFavorite(true);
  };

  if (!hero) {
    return (
      <div className="detail-page">
        <Link className="text-link" href="/">
          Back
        </Link>
        <p className="muted">Loading hero...</p>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <Link className="text-link" href="/">
        Back to all heroes
      </Link>
      <div className="detail-card">
        <div className="detail-image">
          {hero.image_url ? (
            <img src={hero.image_url} alt={hero.name} />
          ) : (
            <div className="image-fallback">No image</div>
          )}
        </div>
        <div className="detail-info">
          <div className="detail-header">
            <div>
              <h1>{hero.name}</h1>
              <p className="muted">
                {hero.full_name || "Unknown identity"} · {hero.publisher || "n/a"}
              </p>
            </div>
            <button
              className={`heart ${isFavorite ? "active" : ""}`}
              onClick={toggleFavorite}
            >
              {isFavorite ? "♥" : "♡"}
            </button>
          </div>
          <div className="detail-meta">
            <div>
              <span className="label">Alignment</span>
              <span>{hero.alignment || "n/a"}</span>
            </div>
            <div>
              <span className="label">Gender</span>
              <span>{hero.gender || "n/a"}</span>
            </div>
            <div>
              <span className="label">Race</span>
              <span>{hero.race || "n/a"}</span>
            </div>
          </div>
          <div className="stats">
            {[
              ["Intelligence", hero.intelligence],
              ["Strength", hero.strength],
              ["Speed", hero.speed],
              ["Durability", hero.durability],
              ["Power", hero.power],
              ["Combat", hero.combat]
            ].map(([label, value]) => (
              <div key={label} className="stat-row">
                <span>{label}</span>
                <span>{value ?? "n/a"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
