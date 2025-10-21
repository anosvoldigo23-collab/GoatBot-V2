const axios = require("axios"); // Importe la bibliothèque axios pour les requêtes HTTP
const fs = require("fs-extra"); // Importe la bibliothèque fs-extra pour gérer les fichiers

module.exports = {
  config: {
    name: "flux3", // Nom de la commande
    aliases: ["fluxv3"], // Alias de la commande
    version: "1.0", // Version de la commande
    author: "Christus x Aesther", // Auteur de la commande
    countDown: 10, // Délai d'attente en secondes entre les utilisations de la commande
    role: 0, // Rôle requis pour utiliser la commande (0 = tous les utilisateurs)
    shortDescription: "Génère une image IA en utilisant l'API FluxAWS", // Description courte de la commande
    longDescription: "Utilisez l'invite et le ratio pour générer des images IA impressionnantes en utilisant fluxaws", // Description longue de la commande
    category: "AI-IMAGE", // Catégorie de la commande
    guide: {
      en: "{pn} <invite> | <ratio>\nExample: {pn} a cat with glasses | 1.2" // Guide d'utilisation en anglais
    }
  },

  onStart: async function ({ api, event, args }) {
    // Fonction exécutée lorsque la commande est appelée
    const input = args.join(" ").split("|"); // Divise les arguments en fonction du caractère "|"
    const query = input[0]?.trim(); // Récupère l'invite (prompt) et supprime les espaces en début et fin
    const ration = input[1]?.trim() || 1; // Récupère le ratio, ou utilise 1 comme valeur par défaut

    if (!query) {
      // Vérifie si l'invite est manquante
      return api.sendMessage(
        "❌ | Veuillez fournir une invite pour générer l'image.\nExemple:\n.flux Un dragon sur Mars | 1.5", // Message d'erreur
        event.threadID, // Identifiant du fil de discussion
        event.messageID // Identifiant du message original
      );
    }

    const waiting = await api.sendMessage("⚙️ | Génération de l'image, veuillez patienter...", event.threadID); // Envoie un message indiquant l'attente

    try {
      // Tentative de génération de l'image
      const response = await axios({
        method: "GET", // Méthode de la requête HTTP
        url: "https://www.arch2devs.ct.ws/api/fluxaws", // URL de l'API
        responseType: "arraybuffer", // Type de réponse attendue (tampon binaire)
        params: {
          query, // Paramètre de l'invite (prompt)
          ration // Paramètre du ratio
        }
      });

      const filePath = __dirname + `/cache/flux_${event.senderID}.png`; // Définit le chemin du fichier image à enregistrer
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary")); // Écrit les données binaires de l'image dans le fichier

      api.sendMessage({
        body: `🧠 Invite: ${query}\n📐 Ratio: ${ration}`, // Corps du message avec l'invite et le ratio
        attachment: fs.createReadStream(filePath) // Attache le fichier image au message
      }, event.threadID, () => fs.unlinkSync(filePath), waiting.messageID); // Envoie le message, puis supprime le fichier image après l'envoi, annule le message d'attente

    } catch (err) {
      // En cas d'erreur lors de la génération de l'image
      console.error(err); // Affiche l'erreur dans la console
      api.sendMessage("❌ | Échec de la génération de l'image. Veuillez réessayer plus tard.", event.threadID, waiting.messageID); // Envoie un message d'erreur et supprime le message d'attente
    }
  }
};