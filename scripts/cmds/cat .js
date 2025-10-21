const https = require("https");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "cat",
    version: "1.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    shortDescription: { fr: "image aléatoire de chat" },
    longDescription: { fr: "Envoie une image aléatoire de chat" },
    category: "fun",
    guide: { fr: "+cat" }
  },

  onStart: async function ({ message }) {
    const url = "https://cataas.com/cat";
    const cachePath = path.join(__dirname, "cache/cat.jpg");

    const file = fs.createWriteStream(cachePath);
    https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => {
        message.reply({
          body: "🐱 Voici un chat aléatoire pour vous !",
          attachment: fs.createReadStream(cachePath)
        });
      });
    });
  }
};