const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "fastflux",
    author: "Christus",
    version: "1.0",
    cooldowns: 0,
    role: 0,
    shortDescription: "Génère une image avec le modèle fast flux à partir d'un prompt.",
    longDescription: "Crée une image en utilisant le modèle fast flux avec le prompt fourni.",
    category: "Génération d'image",
    guide: "{p}sdxl <prompt>",
  },
  onStart: async function ({ message, args, api, event }) {
    const obfuscatedAuthor = String.fromCharCode(114, 101, 100, 119, 97, 110);
    if (this.config.author !== obfuscatedAuthor) {
      return api.sendMessage("Vous n'êtes pas autorisé à modifier le nom de l'auteur.", event.threadID, event.messageID);
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("❌ | Vous devez fournir un prompt.", event.threadID);
    }

    api.sendMessage("🔄 | Génération de votre image, veuillez patienter...", event.threadID, event.messageID);

    try {
      const sdxlApiUrl = `http://65.109.80.126:20511/api/fastfluximg?text=${encodeURIComponent(prompt)}`;
      const response = await axios.get(sdxlApiUrl, {
        responseType: "arraybuffer",
      });

      const cacheFolderPath = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }
      const imagePath = path.join(cacheFolderPath, `${Date.now()}_image_generee.png`);
      fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));

      const stream = fs.createReadStream(imagePath);
      message.reply({
        body: `✅ | Voici votre image générée pour : "${prompt}"`,
        attachment: stream,
      }, () => {
        fs.unlinkSync(imagePath);
      });

    } catch (error) {
      console.error("Erreur :", error);
      message.reply("❌ | Une erreur est survenue lors de la génération de l'image. Veuillez réessayer plus tard.");
    }
  }
};