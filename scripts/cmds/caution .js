const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "caution",
    version: "1.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    shortDescription: {
      fr: "Créer une image style attention avec du texte personnalisé"
    },
    description: {
      fr: "Génère une image meme de style attention en utilisant votre texte"
    },
    category: "𝗙𝗨𝗡 & 𝗝𝗘𝗨",
    guide: {
      fr: "{p}caution <texte>\nExemple : {p}caution Attention !"
    }
  },

  langs: {
    fr: {
      missing: "❌ | Veuillez fournir un texte pour l'image d'attention.",
      error: "❌ | Impossible de générer l'image d'attention."
    }
  },

  onStart: async function ({ message, args, getLang }) {
    if (!args.length) return message.reply(getLang("missing"));

    const text = encodeURIComponent(args.join(" "));

    try {
      const res = await axios.get(`https://api.popcat.xyz/v2/caution?text=${text}`, {
        responseType: "arraybuffer"
      });

      const filePath = path.join(__dirname, "cache", `caution_${Date.now()}.png`);
      fs.writeFileSync(filePath, res.data);

      message.reply({
        body: "⚠️ Voici votre image d'attention !",
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));
    } catch (err) {
      console.error(err);
      message.reply(getLang("error"));
    }
  }
};