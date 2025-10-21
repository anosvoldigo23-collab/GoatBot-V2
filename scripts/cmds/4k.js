const axios = require("axios");
const fs = require("fs");
const path = require("path");

// URL de l'API d'upscale
const apiUrl = "http://65.109.80.126:20409/aryan/4k";

module.exports = {
  config: {
    name: "4k",
    aliases: ["upscale"],
    version: "1.1",
    role: 0,
    author: "Christus",
    countDown: 10,
    longDescription: "Améliore une image pour la convertir en résolution 4K.",
    category: "🖼️ Image",
    guide: {
      fr: "${pn} réponds à une image pour l'améliorer en 4K."
    }
  },

  onStart: async function ({ message, event }) {
    // Vérifie si l'utilisateur a répondu à une image
    if (
      !event.messageReply ||
      !event.messageReply.attachments ||
      !event.messageReply.attachments[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return message.reply("📸 Veuillez répondre à une image pour l'améliorer en 4K.");
    }

    const imageUrl = event.messageReply.attachments[0].url;
    const filePath = path.join(__dirname, "cache", `upscaled_${Date.now()}.png`);
    let processingMsgId;

    try {
      // Message de traitement
      const processingMsg = await message.reply("🔄 Traitement de votre image, veuillez patienter...");
      processingMsgId = processingMsg.messageID;

      // Envoi de l'image à l'API pour amélioration
      const response = await axios.get(`${apiUrl}?imageUrl=${encodeURIComponent(imageUrl)}`);
      if (!response.data.status) throw new Error(response.data.message || "Erreur API");

      // Téléchargement de l'image améliorée
      const enhancedImage = await axios.get(response.data.enhancedImageUrl, { responseType: "stream" });
      const writeStream = fs.createWriteStream(filePath);
      enhancedImage.data.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      // Envoi de l'image finale à l'utilisateur
      await message.reply({
        body: "✅ Voici votre image améliorée en 4K !",
        attachment: fs.createReadStream(filePath),
      });
    } catch (error) {
      console.error("Erreur lors de l'upscale :", error);
      message.reply("❌ Une erreur est survenue lors de l'amélioration de l'image. Veuillez réessayer plus tard.");
    } finally {
      // Supprime le message de traitement et le fichier temporaire
      if (processingMsgId) message.unsend(processingMsgId);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
};