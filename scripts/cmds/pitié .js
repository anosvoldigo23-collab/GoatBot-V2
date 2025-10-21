// Importation des modules nécessaires
const axios = require("axios"); // Pour effectuer des requêtes HTTP
const fs = require("fs");       // Pour manipuler les fichiers
const path = require("path");   // Pour gérer les chemins de fichiers

// Exportation d'un objet contenant la configuration et la fonction principale
module.exports = {
  // Configuration de la commande
  config: {
    name: "pitié",                     // Nom de la commande
    version: "1.0",                   // Version de la commande
    author: "Christus x Aesther",      // Auteur de la commande
    countDown: 10,                   // Temps de latence avant de pouvoir réutiliser la commande (en secondes)
    role: 0,                         // Niveau de permission requis (0 = public)
    shortDescription: {
      en: "Ajoute un effet de patte de chat à la photo de profil" // Description courte (en anglais)
    },
    description: {
      en: "Ajoute un mignon effet de patte de chat à la photo de profil de l'utilisateur mentionné ou de vous-même" // Description détaillée (en anglais)
    },
    category: "image",                // Catégorie de la commande
    guide: {
      en: "{p}pitié [@mention ou répondre]\nSi aucune mention ou réponse, utilise votre photo de profil." // Guide d'utilisation (en anglais)
    }
  },

  // Fonction principale exécutée lorsque la commande est appelée
  onStart: async function ({ api, event, message }) {
    // Récupération des informations de l'événement (utilisateur, mentions, type de message, réponse)
    const { senderID, mentions, type, messageReply } = event;

    // Détermination de l'ID de l'utilisateur dont la photo de profil doit être traitée
    let uid;
    if (Object.keys(mentions).length > 0) {
      // Si une mention est présente, utiliser l'ID de la personne mentionnée
      uid = Object.keys(mentions)[0];
    } else if (type === "message_reply") {
      // Si une réponse à un message est présente, utiliser l'ID de l'expéditeur du message répondu
      uid = messageReply.senderID;
    } else {
      // Sinon, utiliser l'ID de l'utilisateur qui a exécuté la commande
      uid = senderID;
    }

    // Construction de l'URL pour récupérer la photo de profil de l'utilisateur
    const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

    // Tentative d'effectuer les opérations
    try {
      // Envoi d'une requête HTTP à l'API pour générer l'image avec l'effet de patte de chat
      const res = await axios.get(`https://api.popcat.xyz/v2/pet?image=${encodeURIComponent(avatarURL)}`, {
        responseType: "arraybuffer" // Spécifie le type de réponse attendue (données binaires)
      });

      // Définition du chemin du fichier temporaire pour stocker l'image générée
      const filePath = path.join(__dirname, "cache", `pet_${uid}_${Date.now()}.png`);
      // Écriture des données de l'image dans le fichier
      fs.writeFileSync(filePath, res.data);

      // Envoi de la réponse avec l'image générée et suppression du fichier temporaire après l'envoi
      message.reply({
        body: "🐾 Voici votre image avec l'effet de patte de chat !",
        attachment: fs.createReadStream(filePath) // Création d'un flux de lecture du fichier
      }, () => fs.unlinkSync(filePath)); // Supprimer le fichier après l'envoi
    } catch (err) {
      // En cas d'erreur, afficher l'erreur dans la console
      console.error(err);
      // Envoyer un message d'erreur à l'utilisateur
      message.reply("❌ | Échec de la génération de l'image avec l'effet de patte.");
    }
  }
};