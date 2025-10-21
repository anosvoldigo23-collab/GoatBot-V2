const axios = require("axios");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "flux2",
    aliases: ["fluximg", "fluxv2"],
    version: "3.0",
    author: "Christus x Aesther",
    countDown: 10,
    role: 0,
    shortDescription: "Générer une image IA avec l'API Flux v2",
    longDescription: "Génère une image à partir d'un prompt texte en utilisant BetaDash Flux v2",
    category: "IA-IMAGE",
    guide: {
      fr: "{pn} <prompt>"
    }
  },

  langs: {
    fr: {
      loading: "⏰ Génération de l'image avec Flux v2...",
      error: "❌ Échec de la génération de l'image. Veuillez réessayer plus tard."
    }
  },

  onStart: async function ({ message, args, getLang }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("⚠️ Veuillez fournir un prompt !");

    message.reply(getLang("loading"));

    try {
      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/fluxv2?prompt=${encodeURIComponent(prompt)}`;
      const res = await axios.get(apiUrl);

      const imageUrl = res.data.imageUrl;
      if (!imageUrl) throw new Error("Aucune URL d'image trouvée dans la réponse de l'API");

      const imgStream = await getStreamFromURL(imageUrl);

      return message.reply({
        body: `🖼️ Prompt : ${prompt}`,
        attachment: imgStream
      });

    } catch (err) {
      console.error("Erreur API Flux v2 :", err.message || err);
      return message.reply(getLang("error"));
    }
  }
};