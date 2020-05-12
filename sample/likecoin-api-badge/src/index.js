const express = require("express");
const axios = require("axios");
const { BadgeFactory } = require("gh-badges");

const bf = new BadgeFactory();

const STAT_API = `https://api.like.co/like/like/stat`;

const app = express();

const labels = {
  liker: "totalLiker",
  creator: "totalLikee",
  content: "totalArticle",
  LIKE: "LIKEs"
};

app.get("/badge/stats/liker.svg", async (req, res) => {
  try {
    const { data } = await axios.get(STAT_API);
    const svg = bf.create({
      text: ["Liker", data.totalLiker],
      color: "#28646e",
      labelColor: "#4a4a4a",
      template: "flat"
    });
    res.set("Content-Type", "image/svg+xml;charset=utf-8");
    res.status(200).send(svg);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(8080);
