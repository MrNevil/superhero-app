"use client";

import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

export default function HeroModal({ heroId, onClose, isFavorite, onToggleFavorite }) {
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load hero details when modal opens
  useEffect(() => {
    if (!heroId) return;

    const loadHero = async () => {
      try {
        setLoading(true);
        const heroData = await apiGet(`/heroes/${heroId}`);
        setHero(heroData);
      } catch (error) {
        console.error("Failed to load hero", error);
        setHero(null);
      } finally {
        setLoading(false);
      }
    };

    loadHero();
  }, [heroId]);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (heroId) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflowY = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflowY = "auto";
    };
  }, [heroId, onClose]);

  if (!heroId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {loading ? (
          <p className="muted">Loading hero...</p>
        ) : !hero ? (
          <p className="muted">Failed to load hero details.</p>
        ) : (
          <div className="detail-card">
            {/* Hero Image */}
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
                  {hero.full_name && hero.full_name !== hero.name && (
                    <p className="muted" style={{ marginTop: '0.25rem' }}>{hero.full_name}</p>
                  )}
                </div>
                <button
                  className={`heart ${isFavorite ? "active" : ""}`}
                  onClick={onToggleFavorite}
                >
                  {isFavorite ? "♥" : "♡"}
                </button>
              </div>

              <div className="detail-meta">
                {hero.publisher && (
                  <div>
                    <span className="label">Publisher</span>
                    <span>{hero.publisher}</span>
                  </div>
                )}
                {hero.alignment && (
                  <div>
                    <span className="label">Alignment</span>
                    <span style={{ textTransform: 'capitalize' }}>{hero.alignment}</span>
                  </div>
                )}
                {hero.gender && (
                  <div>
                    <span className="label">Gender</span>
                    <span>{hero.gender}</span>
                  </div>
                )}
                {hero.race && (
                  <div>
                    <span className="label">Race</span>
                    <span>{hero.race}</span>
                  </div>
                )}
                {hero.height && (
                  <div>
                    <span className="label">Height</span>
                    <span>{hero.height}</span>
                  </div>
                )}
                {hero.weight && (
                  <div>
                    <span className="label">Weight</span>
                    <span>{hero.weight}</span>
                  </div>
                )}
              </div>

              {hero.occupation && (
                <div>
                  <span className="label">Occupation</span>
                  <p style={{ margin: '0.25rem 0 0' }}>{hero.occupation}</p>
                </div>
              )}

              {hero.base && (
                <div>
                  <span className="label">Base</span>
                  <p style={{ margin: '0.25rem 0 0' }}>{hero.base}</p>
                </div>
              )}

              <div>
                <span className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Power Stats</span>
                <div className="stats">
                  {[
                    ["Intelligence", hero.intelligence],
                    ["Strength", hero.strength],
                    ["Speed", hero.speed],
                    ["Durability", hero.durability],
                    ["Power", hero.power],
                    ["Combat", hero.combat],
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
        )}
      </div>
    </div>
  );
}
