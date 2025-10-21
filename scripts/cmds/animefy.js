const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "animefy",
    version: "1.0",
    role: 0,
    author: "Christus",
    countDown: 10,
    longDescription: "Convertit une image en style anime grâce à Animefy AI.",
    category: "image",
    guide: {
      fr: "{pn} répondre à une image [prompt] [genre] [largeur hauteur]"
    }
  },

  onStart: async function ({ message, event, args }) {
    if (
      !event.messageReply ||
      !event.messageReply.attachments ||
      !event.messageReply.attachments[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return message.reply("⚠ Veuillez répondre à une image pour la convertir en style anime.");
    }

    const originalUrl = event.messageReply.attachments[0].url;

    let prompt = args[0] || "Un magnifique personnage anime";
    let gender = args[1] && ["men", "women"].includes(args[1].toLowerCase()) ? args[1].toLowerCase() : "men";
    let width = args[2] && !isNaN(args[2]) ? parseInt(args[2]) : 768;
    let height = args[3] && !isNaN(args[3]) ? parseInt(args[3]) : 768;

    const apiUrl = `https://arychauhann.onrender.com/api/animefy?imageUrl=${encodeURIComponent(originalUrl)}&prompt=${encodeURIComponent(prompt)}&gender=${gender}&width=${width}&height=${height}`;

    message.reply("🎨 Génération de votre image style anime... Veuillez patienter, cela peut prendre un moment.", async (err, info) => {
      try {
        const { data } = await axios.get(apiUrl);

        if (!data || !data.imageUrl) {
          return message.reply("❌ Échec de la génération de l'image style anime. L'API n'a retourné aucun résultat.");
        }

        const filePath = path.join(__dirname, `animefy_${Date.now()}.png`);
        const imgRes = await axios.get(data.imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, Buffer.from(imgRes.data));

        await message.reply({
          body: `✅ Voici votre image style anime ! 🌸\nPrompt : ${prompt}\nGenre : ${gender}\nTaille : ${width}x${height}`,
          attachment: fs.createReadStream(filePath)
        });

        fs.unlinkSync(filePath);

        message.unsend(info.messageID);
      } catch (error) {
        console.error("animefy.onStart erreur :", error?.response?.data || error.message);
        message.reply("❌ Une erreur est survenue lors de la génération de votre image style anime. Veuillez réessayer plus tard.");
      }
    });
  }
};