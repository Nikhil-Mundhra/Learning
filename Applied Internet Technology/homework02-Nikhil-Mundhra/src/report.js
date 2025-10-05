// report.js

// node src/report.js data/imdb-top-250.csv

import fs from "fs";
import { parse } from "csv-parse";
import { topRated, genreCounts, getTitlesByGenre, topNGenres } from "./imdb.js";
import { RootElement, RectangleElement, TextElement } from "./drawing.js";

const filePath = process.argv[2];

fs.readFile(filePath, "utf8", (err, data) => {
  if (err) throw err;

  parse(data, { columns: true, trim: true }, (err, rows) => {
    if (err) throw err;

    // Transform rows
    const records = rows.map(row => ({
      rank: Number(row.rank),
      title: row.title,
      year: Number(row.year),
      rating: Number(row.rating),
      votes: Number(row.votes),
      genres: row.genres ? row.genres.split(/[,|]/).map(s => s.trim()) : [],
      directors: row.directors ? row.directors.split(/[,|]/).map(s => s.trim()) : [],
      actors: row.actors ? row.actors.split(/[,|]/).map(s => s.trim()) : [],
      runtime_minutes: Number(row.runtime_minutes)
    }));

    // Reports
    console.log("Top rated movie:");
    console.log(topRated(records));

    console.log("\nDrama titles:");
    console.log(getTitlesByGenre(records, "Drama").slice(0, 10)); // show first 10

    const topGenres = topNGenres(records, 5);
    console.log("\nTop 5 genres:");
    console.log(topGenres);

    // Draw SVG bar chart
    const root = new RootElement();
    root.addAttrs({ width: 600, height: 300 });

    const barWidth = 100;
    const barGap = 20;
    const scale = 2; // pixels per count

    topGenres.map(([genre, count], i) => {
      const x = 50;
      const y = i * (barWidth + barGap) + 30;
      const height = count * scale;
      const bar = new RectangleElement(x, y, height, barWidth, "steelblue");
      root.addChild(bar);

      const label = new TextElement(x + height + 10, y + barWidth / 2, 14, "black", `${genre}, ${count}`);
      root.addChild(label);
    });

    root.write("genres.svg", () => console.log("Wrote genres.svg"));
  });
});
