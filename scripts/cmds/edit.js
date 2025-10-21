const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    version: "1.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    shortDescription: "Modifier une image avec un prompt",
    longDescription: "Modifie une image téléchargée en fonction de votre prompt.",
    category: "AI-IMAGE",
    guide: "{p}edit [prompt] (répondez à une image)"
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(" ");
    const repliedImage = event.messageReply?.attachments?.[0];

    if (!prompt || !repliedImage || repliedImage.type !== "photo") {
      return message.reply("Veuillez répondre à une photo avec votre prompt pour la modifier.");
    }
    
    api.setMessageReaction("🛠️", event.messageID, () => {}, true);

    const imgPath = path.join(__dirname, "cache", `${Date.now()}_edit.jpg`);

    try {
      const imgURL = repliedImage.url;
      const imageUrl = `https://edit-and-gen.onrender.com/gen?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imgURL)}`;
      const res = await axios.get(imageUrl, { responseType: "arraybuffer" });

      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, Buffer.from(res.data, "binary"));

      message.reply({
        body: `✅ Image modifiée pour : "${prompt}"`,
        attachment: fs.createReadStream(imgPath)
      });
      
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      console.error("Erreur EDIT :", err);
      message.reply("❌ Échec de la modification de l'image. Veuillez réessayer plus tard.");
      
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      
    } finally {
      if (fs.existsSync(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
};