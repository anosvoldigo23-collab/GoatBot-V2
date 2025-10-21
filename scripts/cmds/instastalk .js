const axios = require("axios");

module.exports = {
  config: {
    name: "instastalk", // Nom de la commande
    aliases: ["igstalk"], // Alias de la commande (autres noms possibles)
    version: "1.0", // Version de la commande
    author: "Christus x Aesther", // Auteur de la commande
    countDown: 5, // Temps de recharge (en secondes)
    role: 0, // Rôle requis pour utiliser la commande (0 = tous)
    shortDescription: { en: "Espionner un profil Instagram" }, // Description courte (en anglais et en français)
    longDescription: { en: "Récupère les détails d'un profil Instagram (public) en utilisant l'API Aryan." }, // Description longue (en anglais et en français)
    category: "social", // Catégorie de la commande
    guide: { en: "{pn} <nom_utilisateur>\n\nExemple:\n{pn} arychauhann" } // Guide d'utilisation (en anglais et en français)
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0]) return api.sendMessage("❌ Veuillez fournir un nom d'utilisateur Instagram.", event.threadID, event.messageID);

    const username = args[0].replace("@", ""); // Supprime le symbole @ si présent
    api.setMessageReaction("⏳", event.messageID, () => {}, true); // Ajoute une réaction "⏳" au message pendant le traitement

    try {
      const url = `https://aryanapi.up.railway.app/api/instastalk?query=${encodeURIComponent(username)}`; // URL de l'API avec le nom d'utilisateur encodé
      const { data } = await axios.get(url); // Effectue une requête GET vers l'API

      if (!data.status || !data.result) {
        return api.sendMessage("❌ Impossible de récupérer les informations du profil.", event.threadID, event.messageID); // Renvoie un message d'erreur si les données ne sont pas valides
      }

      const result = data.result; // Extrait les données du résultat de l'API
      const caption =
        `📸 Profil Instagram Espionné

👤 Nom complet: ${result.fullName || "N/A"} // Affiche le nom complet ou "N/A" si non disponible
🔗 Nom d'utilisateur: ${result.username} // Affiche le nom d'utilisateur
📝 Bio: ${result.bio || "Pas de bio"} // Affiche la bio ou "Pas de bio" si non disponible
✅ Vérifié: ${result.isVerified ? "Oui" : "Non"} // Affiche "Oui" ou "Non" selon si le compte est vérifié

👥 Abonnés: ${result.followers} // Affiche le nombre d'abonnés
📂 Publications: ${result.uploads} // Affiche le nombre de publications
📊 Engagement: ${result.engagement} // Affiche l'engagement (peut varier selon l'API)

👀 Demandé par: @${event.senderID}`; // Affiche qui a demandé l'espionnage

      api.sendMessage({
        body: caption, // Envoie la légende avec les informations du profil
        attachment: await getStreamFromURL(result.profileImage) // Attache l'image de profil
      }, event.threadID, event.messageID);

      api.setMessageReaction("✅", event.messageID, () => {}, true); // Ajoute une réaction "✅" pour indiquer le succès

    } catch (err) {
      console.error("❌ Erreur Instastalk:", err.message); // Affiche l'erreur dans la console
      api.sendMessage("❌ Échec de la récupération des informations du profil Instagram.", event.threadID, event.messageID); // Envoie un message d'erreur à l'utilisateur
      api.setMessageReaction("❌", event.messageID, () => {}, true); // Ajoute une réaction "❌" en cas d'erreur
    }
  }
};

async function getStreamFromURL(url) {
  const axios = require("axios");
  const res = await axios({ url, responseType: "stream" });
  return res.data;
}