import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getGallery } from "../api/client";
import PageTitle from "../components/PageTitle";

function apiDate(dateString) {
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(dateString);
  return new Date(hasTimezone ? dateString : `${dateString}Z`);
}

function timestamp(photo) {
  const value = apiDate(photo.submitted_at).getTime();
  return Number.isNaN(value) ? 0 : value;
}

function formatDate(dateString) {
  const date = apiDate(dateString);
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
            src={photo.thumbnail_url || photo.image_url}
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
      <div className="gallery-modal" role="dialog" aria-modal="true" aria-label="Photo details">
        <button
          type="button"
          className="gallery-modal-close"
          onClick={onClose}
          aria-label="Close photo details"
        >
          ×
        </button>
        <div className="gallery-modal-image-wrap">
          <img src={photo.image_url} alt={photo.alt || ""} />
        </div>
        <aside className="gallery-modal-details">
          <p className="gallery-modal-label">Submitted</p>
          <time dateTime={photo.submitted_at}>{formatDate(photo.submitted_at)}</time>
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
  const [gallery, setGallery] = useState({ albums: [], photos: [] });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true);
        setError("");
        setGallery(await getGallery());
      } catch (err) {
        console.error("画廊加载失败:", err);
        setError("Gallery 加载失败，请检查后端是否启动。");
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  const albums = gallery.albums || [];
  const photos = gallery.photos || [];
  const albumCards = albums.map((album) => {
    const albumPhotos = photos
      .filter((photo) => photo.album_id === album.id)
      .sort((a, b) => timestamp(a) - timestamp(b));
    return { ...album, photos: albumPhotos, cover: albumPhotos[0] || null };
  });
  const activeAlbum = albumCards.find((album) => album.slug === albumId);
  const unclassifiedPhotos = photos
    .filter((photo) => photo.album_id === null)
    .sort((a, b) => timestamp(b) - timestamp(a));

  if (loading) {
    return (
      <section className="page-section">
        <div className="content-width"><p className="muted-text">Loading gallery...</p></div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="content-width"><p className="error-text">{error}</p></div>
      </section>
    );
  }

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
            <PageTitle eyebrow={<Link to="/gallery">← Gallery</Link>} title={activeAlbum.title} />
            {activeAlbum.description && <p className="gallery-intro">{activeAlbum.description}</p>}
            <PhotoGrid photos={[...activeAlbum.photos].reverse()} onSelect={setSelectedPhoto} />
          </>
        ) : (
          <>
            <PageTitle eyebrow="Life Trace" title="Gallery" />
            {photos.length === 0 && albums.length === 0 ? (
              <p className="gallery-empty muted-text">
                The gallery is ready. Add your first album or photo from the management page.
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
                        <Link to={`/gallery/${album.slug}`} className="gallery-album-card" key={album.id}>
                          <div className="gallery-album-cover">
                            {album.cover ? (
                              <img
                                src={album.cover.thumbnail_url || album.cover.image_url}
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
            <div className="gallery-admin-entry">
              <Link to="/admin/gallery">Manage Gallery</Link>
            </div>
          </>
        )}
      </div>
      <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </section>
  );
}

export default GalleryPage;