import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import galleryData from "../data/gallery.json";

function timestamp(photo) {
  const value = new Date(photo.submittedAt).getTime();
  return Number.isNaN(value) ? 0 : value;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString || "Date unknown";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PhotoGrid({ photos, onSelect }) {
  if (photos.length === 0) {
    return <p className="gallery-empty muted-text">No photos here yet.</p>;
  }

  return (
    <div className="gallery-photo-grid">
      {photos.map((photo) => (
        <button
          type="button"
          className="gallery-photo-button"
          key={photo.id}
          onClick={() => onSelect(photo)}
          aria-label={`View ${photo.alt || photo.note || "photo"}`}
        >
          <img
            src={photo.thumbnail || photo.src}
            alt={photo.alt || ""}
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}

function PhotoModal({ photo, onClose }) {
  useEffect(() => {
    if (!photo) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <div
      className="gallery-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="gallery-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Photo details"
      >
        <button
          type="button"
          className="gallery-modal-close"
          onClick={onClose}
          aria-label="Close photo details"
        >
          ×
        </button>
        <div className="gallery-modal-image-wrap">
          <img src={photo.src} alt={photo.alt || ""} />
        </div>
        <aside className="gallery-modal-details">
          <p className="gallery-modal-label">Submitted</p>
          <time dateTime={photo.submittedAt}>{formatDate(photo.submittedAt)}</time>
          <div className="gallery-modal-divider" />
          <p className="gallery-modal-label">Note</p>
          <p className="gallery-modal-note">{photo.note || "No note for this moment."}</p>
        </aside>
      </div>
    </div>
  );
}

function GalleryPage() {
  const { albumId } = useParams();
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const albums = Array.isArray(galleryData.albums) ? galleryData.albums : [];
  const photos = Array.isArray(galleryData.photos) ? galleryData.photos : [];

  const albumCards = albums.map((album) => {
    const albumPhotos = photos
      .filter((photo) => photo.albumId === album.id)
      .sort((a, b) => timestamp(a) - timestamp(b));
    return { ...album, photos: albumPhotos, cover: albumPhotos[0] || null };
  });

  const activeAlbum = albumCards.find((album) => album.id === albumId);
  const unclassifiedPhotos = photos
    .filter((photo) => !photo.albumId)
    .sort((a, b) => timestamp(b) - timestamp(a));

  if (albumId && !activeAlbum) {
    return (
      <section className="page-section">
        <div className="content-width">
          <PageTitle eyebrow="Life Trace" title="Album not found" />
          <p className="gallery-empty muted-text">
            This album does not exist. <Link to="/gallery">Back to Gallery</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="gallery-width">
        {activeAlbum ? (
          <>
            <PageTitle
              eyebrow={<Link to="/gallery">← Gallery</Link>}
              title={activeAlbum.title}
            />
            {activeAlbum.description && (
              <p className="gallery-intro">{activeAlbum.description}</p>
            )}
            <PhotoGrid
              photos={[...activeAlbum.photos].reverse()}
              onSelect={setSelectedPhoto}
            />
          </>
        ) : (
          <>
            <PageTitle eyebrow="Life Trace" title="Gallery" />
            {photos.length === 0 && albums.length === 0 ? (
              <p className="gallery-empty muted-text">
                The gallery is ready. Add albums and photos in the gallery data file.
              </p>
            ) : (
              <>
                {unclassifiedPhotos.length > 0 && (
                  <section className="gallery-section">
                    <h2 className="gallery-section-title">Latest Moments</h2>
                    <PhotoGrid photos={unclassifiedPhotos} onSelect={setSelectedPhoto} />
                  </section>
                )}

                {albumCards.length > 0 && (
                  <section className="gallery-section">
                    <h2 className="gallery-section-title">Albums</h2>
                    <div className="gallery-album-grid">
                      {albumCards.map((album) => (
                        <Link
                          to={`/gallery/${encodeURIComponent(album.id)}`}
                          className="gallery-album-card"
                          key={album.id}
                        >
                          <div className="gallery-album-cover">
                            {album.cover ? (
                              <img
                                src={album.cover.thumbnail || album.cover.src}
                                alt={album.cover.alt || ""}
                                loading="lazy"
                              />
                            ) : (
                              <span>Empty album</span>
                            )}
                          </div>
                          <div className="gallery-album-meta">
                            <h3>{album.title}</h3>
                            <p>{album.photos.length} {album.photos.length === 1 ? "photo" : "photos"}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>

      <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </section>
  );
}

export default GalleryPage;