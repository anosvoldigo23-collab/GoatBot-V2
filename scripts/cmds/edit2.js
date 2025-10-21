const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "edit2",
    aliases: [],
    version: "1.4",
    author: "Christus",
    countDown: 30,
    role: 0,
    shortDescription: "Modifier ou générer une image avec Gemini-Edit",
    category: "𝗔𝗜",
    guide: {
      en: "Répondez à une image avec : edit <texte> (modifier l'image)\nOu tapez simplement : edit <mot-clé> (générer une image)",
    },
  },

  onStart: async function () {},

  onChat: async function ({ message, event, api }) {
    if (!event.body || !event.body.toLowerCase().startsWith("edit")) return;

    let prompt = event.body.substring(4).trim();
    if (!prompt) prompt = "améliorer"; // par défaut

    const apiurl = "https://gemini-edit-omega.vercel.app/edit";
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const processingMsg = await message.reply(`🫩 Patientez, je traite : "${prompt}" ...`);

    try {
      let params = { prompt };

      // --- Cas 1 : réponse à une image -> édition ---
      if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments[0]) {
        const image = event.messageReply.attachments[0];
        if (image.type !== "photo") {
          return message.reply("❌ Vous devez répondre à une photo.");
        }
        params.imgurl = image.url;
      }

      // --- Cas 2 : pas d’image reply -> génération ---
      const res = await axios.get(apiurl, { params });

      if (!res.data || !res.data.images || !res.data.images[0]) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("❌ Échec de la génération/modification de l'image.");
      }

      // Conversion base64 → Buffer
      const base64Image = res.data.images[0].replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Image, "base64");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const imagePath = path.join(cacheDir, `${Date.now()}.png`);
      fs.writeFileSync(imagePath, imageBuffer);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // Supprime le message "en cours" et envoie le résultat
      await api.unsendMessage(processingMsg.messageID);
      await message.reply(
        { body: `🫩 Résultat : "${prompt}"`, attachment: fs.createReadStream(imagePath) },
        event.threadID,
        () => fs.unlinkSync(imagePath),
        event.messageID
      );
    } catch (error) {
      console.error("❌ ERREUR API :", error.response?.data || error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ Une erreur est survenue lors de la modification/génération de l'image.");
    }
  },
};