// imdb.js

function topRated(records) {
    return records
      .filter(r => typeof r.rating === "number" && !isNaN(r.rating))
      .reduce((best, r) => (best == null || r.rating > best.rating ? r : best), null);
  }
  
  function genreCounts(records) {
    return records
      .filter(r => Array.isArray(r.genres) && r.genres.length > 0)
      .reduce((acc, r) => {
        return r.genres.reduce((inner, g) => {
          const genre = g.trim();
          return genre
            ? { ...inner, [genre]: (inner[genre] || 0) + 1 }
            : inner;
        }, acc);
      }, {});
  }
  
  function getTitlesByGenre(records, genre) {
    return records
      .filter(r => Array.isArray(r.genres) && r.genres.some(g => g.toLowerCase() === genre.toLowerCase()))
      .filter(r => typeof r.year === "number" && !isNaN(r.year))
      .map(r => `${r.title.toUpperCase()} (${r.year})`);
  }
  
  function topNGenres(records, n) {
    const counts = genreCounts(records);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
  }
  
  export { topRated, genreCounts, getTitlesByGenre, topNGenres };
  