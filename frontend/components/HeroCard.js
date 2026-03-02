// Simple card component to display hero information
// Props: hero (data), isFavorite (boolean), onToggleFavorite (function), onClick (function)
export default function HeroCard({ hero, isFavorite, onToggleFavorite, onClick }) {
  const content = (
    <>
      <div className="card-image">
        {hero.image_url ? (
          <img src={hero.image_url} alt={hero.name} loading="lazy" />
        ) : (
          <div className="image-fallback">No image</div>
        )}
      </div>
      <div className="card-body">
        <div>
          <h3>{hero.name}</h3>
          {(hero.publisher || hero.alignment) && (
            <p className="muted">
              {[hero.publisher, hero.alignment].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <button
          className={`heart ${isFavorite ? "active" : ""}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>
    </>
  );

  if (onClick) {
    return (
      <div className="card" onClick={onClick} style={{ cursor: "pointer" }}>
        {content}
      </div>
    );
  }

  return <div className="card">{content}</div>;
}
