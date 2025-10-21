const axios = require("axios");

module.exports = {
 config: {
 name: "gitstalk", // Nom de la commande
 version: "1.0", // Version de la commande
 author: "Christus x Aesther", // Auteur de la commande
 countDown: 5, // Délai d'attente avant de pouvoir réutiliser la commande (en secondes)
 role: 0, // Niveau de rôle requis pour utiliser la commande (0 = tout le monde)
 shortDescription: { en: "Espionner un profil GitHub" }, // Description courte de la commande (en anglais)
 longDescription: { en: "Récupère les détails d'un utilisateur GitHub (publics) en utilisant l'API d'Aryan." }, // Description longue de la commande (en anglais)
 category: "social", // Catégorie de la commande
 guide: { en: "{pn} <nom-d'utilisateur-github>\n\nExample:\n{pn} ntkhang03" } // Guide d'utilisation de la commande (en anglais)
 },

 onStart: async function ({ api, args, event }) { // Fonction exécutée lorsque la commande est appelée
  if (!args[0]) { // Vérifie si un nom d'utilisateur GitHub a été fourni
  return api.sendMessage("❌ Veuillez fournir un nom d'utilisateur GitHub.", event.threadID, event.messageID); // Renvoie un message d'erreur si aucun nom d'utilisateur n'est fourni
  }

  const username = args[0]; // Récupère le nom d'utilisateur fourni en argument
  api.setMessageReaction("⏳", event.messageID, () => {}, true); // Ajoute une réaction "⏳" (en attente) au message de l'utilisateur

  try {
  const url = `https://aryanapi.up.railway.app/api/gitinfo?username=${encodeURIComponent(username)}`; // Construit l'URL de l'API avec le nom d'utilisateur
  const { data } = await axios.get(url); // Effectue une requête GET à l'API pour récupérer les données du profil

  if (!data.status || !data.data) { // Vérifie si la requête a réussi et si des données ont été retournées
  return api.sendMessage("❌ Impossible de récupérer les informations du profil GitHub.", event.threadID, event.messageID); // Renvoie un message d'erreur si la requête a échoué
  }

  const u = data.data; // Récupère les données du profil
  const caption = // Construit la légende du message à envoyer
  `🐙 Espionnage de profil GitHub

  👤 Nom: ${u.name || "N/A"}
  🔗 Nom d'utilisateur: ${u.login}
  📝 Bio: ${u.bio || "Pas de bio"}

  📂 Repos publics: ${u.public_repos}
  📑 Gists publics: ${u.public_gists}
  👥 Abonnés: ${u.followers}
  ➡️ Suivi: ${u.following}

  📅 Rejoint le: ${new Date(u.created_at).toLocaleDateString()}
  ♻️ Dernière mise à jour: ${new Date(u.updated_at).toLocaleDateString()}

  🌍 Blog: ${u.blog || "N/A"}
  🐦 Twitter: ${u.twitter_username || "N/A"}
  🏢 Entreprise: ${u.company || "N/A"}
  📍 Lieu: ${u.location || "N/A"}

  🔗 Profil: ${u.html_url}

  👀 Demandé par: @${event.senderID}`;

  api.sendMessage({ // Envoie le message avec la légende et l'avatar du profil
  body: caption,
  attachment: await getStreamFromURL(u.avatar_url)
  }, event.threadID, event.messageID);

  api.setMessageReaction("✅", event.messageID, () => {}, true); // Ajoute une réaction "✅" (succès) au message de l'utilisateur

  } catch (err) { // Gère les erreurs potentielles
  console.error("❌ Erreur Gitstalk:", err.message); // Affiche l'erreur dans la console
  api.sendMessage("❌ Échec de la récupération des informations du profil GitHub.", event.threadID, event.messageID); // Renvoie un message d'erreur à l'utilisateur
  api.setMessageReaction("❌", event.messageID, () => {}, true); // Ajoute une réaction "❌" (échec) au message de l'utilisateur
  }
 }
};

async function getStreamFromURL(url) { // Fonction pour récupérer un flux de données à partir d'une URL
  const res = await axios({ url, responseType: "stream" }); // Effectue une requête GET pour récupérer un flux de données
  return res.data; // Renvoie le flux de données
}