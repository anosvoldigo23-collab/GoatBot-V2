const axios = require('axios');

module.exports = { config: { name: "gpt4o", aliases: ["askgpt4o", "kohi"], version: "1.0", author: "Christus", countDown: 5, role: 0, shortDescription: "Pose une question à GPT-4o (API Kohi)", longDescription: "Utilise l'API https://api-library-kohi.onrender.com/api/gpt4o pour envoyer une question et obtenir une réponse IA.", category: "𝗔𝗜", guide: "{pn} <question> — ou reply à un message" },

onStart: async function ({ message, args, event, api }) { try { let prompt = args.join(' ').trim(); if (!prompt && event.messageReply && event.messageReply.body) { prompt = event.messageReply.body; }

if (!prompt) {
    return api.sendMessage('❗️ Utilisation : {pn} <question> — ou répondez à un message contenant votre question.', event.threadID, event.messageID);
  }

  const waiting = await api.sendMessage('🤖 GPT-4o est en train de réfléchir...', event.threadID);

  const url = `https://api-library-kohi.onrender.com/api/gpt4o?prompt=${encodeURIComponent(prompt)}`;
  const res = await axios.get(url, { timeout: 60000 });

  if (!res.data || !res.data.status) {
    await api.unsendMessage(waiting.messageID);
    return api.sendMessage('❌ Aucune réponse reçue de GPT-4o.', event.threadID, event.messageID);
  }

  const answer = res.data.data || '⚠️ Réponse vide';

  await api.unsendMessage(waiting.messageID);
  return api.sendMessage(answer, event.threadID, event.messageID);

} catch (err) {
  console.error(err);
  const errorMsg = (err.response && err.response.data) ? JSON.stringify(err.response.data) : err.message;
  return api.sendMessage(`❌ Erreur lors de la requête GPT-4o :\n${errorMsg}`, event.threadID, event.messageID);
}

} };

