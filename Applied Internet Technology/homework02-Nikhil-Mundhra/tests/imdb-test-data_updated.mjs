// test/imdb_test_data.mjs
export const records = [
  {
    rank: 1,
    title: "Alpha",
    year: 2001,
    rating: 9.1,
    votes: 100000,
    genres: ["Drama"],
    directors: ["Dir A"],
    actors: ["A1", "A2"]
  },
  {
    rank: 2,
    title: "Bravo",
    year: 2002,
    rating: 9.3, // highest rating → topRated should return this
    votes: 90000,
    genres: ["Drama", "Crime"],
    directors: ["Dir B"],
    actors: ["B1"]
  },
  {
    rank: 3,
    title: "Charlie",
    year: 2003,
    rating: 8.8,
    votes: 80000,
    genres: ["Action"],
    directors: ["Dir C"],
    actors: ["C1"]
  }
];
