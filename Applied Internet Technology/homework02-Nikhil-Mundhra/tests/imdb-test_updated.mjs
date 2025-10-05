import { expect } from "chai";
import { topRated, getTitlesByGenre, genreCounts, topNGenres } from "../src/imdb.js";
import { records } from "./imdb-test-data.mjs"; // updated this from "./imdb_test_data.mjs" 

describe("imdb", function () {
  describe("topRated", function () {
    it("returns the movie with the highest rating", function () {
      const best = topRated(records);

      // Here we are only checking the essential fields as per imdb corrected test file
      expect(best).to.include({
        rank: 2,
        title: "Bravo",
        year: 2002,
        rating: 9.3,
      });
    });
  });

  describe("getTitlesByGenre", function () {
    it('returns all titles for a genre as "TITLE (YEAR)" in uppercase', function () {
      const expectedDrama = ["ALPHA (2001)", "BRAVO (2002)"];
      expect(getTitlesByGenre(records, "Drama")).to.have.all.members(expectedDrama);

      const expectedAction = ["CHARLIE (2003)"];
      expect(getTitlesByGenre(records, "action")).to.have.all.members(expectedAction); // case-insensitive
    });
  });

  describe("genreCounts", function () {
    it("returns an object of genre -> count", function () {
      // Alpha: Drama
      // Bravo: Drama + Crime
      // Charlie: Action
      const expected = { Drama: 2, Crime: 1, Action: 1 };
      expect(genreCounts(records)).to.eql(expected);
    });
  });

  describe("topNGenres", function () {
    it("returns top n [genre, count] pairs sorted by count desc", function () {
      const top2 = topNGenres(records, 2);
      expect(top2[0]).to.eql(["Drama", 2]);
      // Next could be Crime or Action (both 1)
      expect([["Crime", 1], ["Action", 1]]).to.deep.include(top2[1]);
    });
  });
});