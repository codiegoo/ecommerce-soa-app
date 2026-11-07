const suitImages = [
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&q=85",
  "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=900&q=85",
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&q=85",
  "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=900&q=85",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&q=85",
];

export function getProductImage(id: number) {
  return suitImages[Math.abs(id - 1) % suitImages.length];
}