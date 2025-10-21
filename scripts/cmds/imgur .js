const axios = require("axios");

module.exports = {
  config: {
    name: "imgur", // Nom de la commande
    version: "1.0.0", // Version de la commande
    author: "Christus", // Auteur de la commande
    countDown: 0, // Temps d'attente avant de pouvoir réutiliser la commande (en secondes)
    role: 0, // Niveau de rôle requis pour utiliser la commande (0 = tous)
    shortDescription: "Télécharger une image/vidéo sur Imgur", // Description courte de la commande
    longDescription: "Répondre à une image/vidéo ou fournir une URL pour la télécharger sur Imgur.", // Description longue de la commande
    category: "utilitaire", // Catégorie de la commande
    guide: "{pn} répondre à une image/vidéo ou fournir une URL" // Aide pour utiliser la commande ({pn} représente le préfixe de la commande)
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event; // Récupère les informations de l'événement (ID du fil de discussion, ID du message, réponse au message)
    let mediaUrl = ""; // Initialise une variable pour l'URL du média

    // Détermine l'URL du média : soit à partir d'une réponse à un message, soit à partir d'un argument fourni
    if (messageReply && messageReply.attachments.length > 0) { // Si la commande répond à un message et que ce message contient des pièces jointes
      mediaUrl = messageReply.attachments[0].url; // Utilise l'URL de la première pièce jointe
    } else if (args.length > 0) { // Si des arguments sont fournis avec la commande
      mediaUrl = args.join(" "); // Joins les arguments pour former l'URL
    }

    if (!mediaUrl) { // Si aucune URL n'a été déterminée
      return api.sendMessage("❌ Veuillez répondre à une image/vidéo ou fournir une URL !", threadID, messageID); // Envoie un message d'erreur
    }

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true); // Ajoute une réaction "En attente" au message

      // Envoie une requête à un serveur pour téléverser l'image/vidéo sur Imgur
      const res = await axios.get(`http://65.109.80.126:20409/aryan/imgur?url=${encodeURIComponent(mediaUrl)}`);
      const imgurLink = res.data.imgur; // Récupère le lien Imgur depuis la réponse

      if (!imgurLink) { // Si le lien Imgur est vide
        api.setMessageReaction("", messageID, () => {}, true); // Supprime toutes les réactions au message
        return api.sendMessage("❌ Échec du téléchargement sur Imgur.", threadID, messageID); // Envoie un message d'erreur
      }

      api.setMessageReaction("✅", messageID, () => {}, true); // Ajoute une réaction "Succès" au message
      return api.sendMessage(`${imgurLink}`, threadID, messageID); // Envoie le lien Imgur dans le fil de discussion

    } catch (err) { // Si une erreur se produit pendant le processus
      console.error("Erreur de téléchargement Imgur :", err); // Affiche l'erreur dans la console
      api.setMessageReaction("", messageID, () => {}, true); // Supprime toutes les réactions au message
      return api.sendMessage("⚠ Une erreur s'est produite lors du téléchargement.", threadID, messageID); // Envoie un message d'erreur
    }
  }
};