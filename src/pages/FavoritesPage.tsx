import { useState } from "react";
import { ImageCard } from "../components/ImageCard.tsx";
import { loadFavorites, removeFavorite } from "../services/favoritesStore.ts";
import type { FavoriteItem } from "../types.ts";

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);

  const handleRemove = (id: string) => {
    const updated = removeFavorite(id);
    setFavorites(updated);
  };

  return (
    <div className="page favorites-page">
      <h2>Favorites ({favorites.length})</h2>

      {favorites.length === 0 ? (
        <p className="empty-message">
          No favorites yet. Explore random images and add some!
        </p>
      ) : (
        <div className="image-grid">
          {favorites.map((fav) => (
            <ImageCard
              key={fav.id}
              url={fav.url}
              imageNumber={fav.imageNumber}
              onRemove={() => handleRemove(fav.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
