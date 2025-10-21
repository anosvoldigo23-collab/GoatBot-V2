const axios = require("axios");
const g = require("fca-aryan-nix"); // GoatWrapper pour noprefix

module.exports = {
  config: {
    name: "ai",
    version: "1.1",
    author: "Christus",
    countDown: 3,
    role: 0,
    category: "AI",
    shortDescription: { fr: "🤖 Chat avec LLaMA-4 Maverick" },
    longDescription: { fr: "Discute directement avec le modèle LLaMA-4 Maverick 17B en NOPREFIX." },
    guide: { fr: "Écris simplement ta question sans préfixe." },
    noPrefix: true // Activation NOPREFIX
  },

  onStart: async function ({ message, event }) {
    try {
      const prompt = event.body;
      if (!prompt) return;

      const uid = event.senderID || "123";
      const apiURL = `https://arychauhann.onrender.com/api/llama-4-maverick-17b-128e-instruct?uid=${uid}&prompt=${encodeURIComponent(prompt)}&url=`;

      const res = await axios.get(apiURL);
      const data = res.data;

      if (!data.status || !data.reply) {
        return message.reply("❌ LLaMA-4 n'a pas pu générer de réponse.");
      }

      const response = data.reply.trim();

      const formattedMsg = `
┌───────────────────────────────┐
│ ⚡ 𝐋𝐋𝐚𝐌𝐀-4 𝐌𝐚𝐯𝐞𝐫𝐢𝐜𝐤 ⚡ │
├───────────────────────────────┤
│ 💬 𝑄𝑈𝐸𝑆𝑇𝐼𝑂𝑁 :
│ ${prompt}
├───────────────────────────────┤
│ 🧠 𝑅𝐸́𝑃𝑂𝑁𝑆𝐸𝑆 :
│ ${response}
└───────────────────────────────┘`;

      await message.reply(formattedMsg);
    } catch (error) {
      console.error(error);
      await message.reply("⚠️ Erreur de connexion à l'API LLaMA-4.");
    }
  }
};

// Activation noprefix via GoatWrapper
const w = new g.GoatWrapper(module.exports);
w.applyNoPrefix({ allowPrefix: false });
