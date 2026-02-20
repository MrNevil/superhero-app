import Link from "next/link";

export default function HeroCard({ hero, isFavorite, onToggleFavorite, linkHref }) {
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
          <p className="muted">
            {hero.publisher || "Unknown"} · {hero.alignment || "n/a"}
          </p>
        </div>
        <button
          className={`heart ${isFavorite ? "active" : ""}`}
          onClick={(event) => {
            event.preventDefault();
            onToggleFavorite();
          }}
          aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>
    </>
  );

  if (linkHref) {
    return (
      <Link className="card" href={linkHref}>
        {content}
      </Link>
    );
  }

  return <div className="card">{content}</div>;
}
