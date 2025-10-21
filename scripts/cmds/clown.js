const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "clown",
    version: "1.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    shortDescription: {
      fr: "Ajouter un effet visage de clown à la photo de profil"
    },
    description: {
      fr: "Applique un effet visage de clown à votre avatar ou à celui d'un utilisateur mentionné"
    },
    category: "𝗙𝗨𝗡 & 𝗝𝗘𝗨",
    guide: {
      fr: "{p}clown [@mention ou réponse]\nSi aucune mention ou réponse, utilise votre photo de profil."
    }
  },

  onStart: async function ({ api, event, message }) {
    const { senderID, mentions, type, messageReply } = event;

    // Récupérer l'ID de l'utilisateur pour l'avatar
    let uid;

    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (type === "message_reply") {
      uid = messageReply.senderID;
    } else {
      uid = senderID;
    }

    const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

    try {
      const res = await axios.get(`https://api.popcat.xyz/v2/clown?image=${encodeURIComponent(avatarURL)}`, {
        responseType: "arraybuffer"
      });

      const filePath = path.join(__dirname, "cache", `clown_${uid}_${Date.now()}.png`);
      fs.writeFileSync(filePath, res.data);

      message.reply({
        body: "🤡 Voici votre image avec effet clown !",
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error(err);
      message.reply("❌ | Impossible de générer l'image clown.");
    }
  }
};