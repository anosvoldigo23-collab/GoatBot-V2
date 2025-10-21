const axios = require("axios");

module.exports = {
  config: {
    name: "gpt5",
    aliases: ["g5", "chatgpt5"],
    version: "1.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    shortDescription: "Discuter avec GPT-5",
    longDescription: "Pose une question et reçois une réponse générée par GPT-5 (API externe).",
    category: "IA",
    guide: {
      fr: "{pn} <texte>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("❌ Veuillez entrer un texte à envoyer à GPT-5.", event.threadID, event.messageID);

    try {
      const url = `https://arychauhann.onrender.com/api/gpt5?prompt=${encodeURIComponent(prompt)}&uid=${event.senderID}`;
      const res = await axios.get(url);
      if (res.data && res.data.result) {
        api.sendMessage(res.data.result, event.threadID, event.messageID);
      } else {
        api.sendMessage("⚠️ Impossible d'obtenir une réponse de l'API GPT-5.", event.threadID, event.messageID);
      }
    } catch (err) {
      api.sendMessage("❌ Une erreur est survenue lors de la connexion à l'API GPT-5.", event.threadID, event.messageID);
      console.error(err);
    }
  }
};