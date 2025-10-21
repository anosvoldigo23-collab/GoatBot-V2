const axios = require("axios"); // Importe la bibliothèque axios pour faire des requêtes HTTP.
const fs = require("fs"); // Importe le module fs pour interagir avec le système de fichiers.
const path = require("path"); // Importe le module path pour gérer les chemins de fichiers.

module.exports = {
  config: {
    name: "gay", // Nom de la commande (par exemple, pour l'utiliser : préfixe gay)
    aliases: [], // Alias pour la commande (noms alternatifs, par exemple : ['homo', 'lgbt'])
    version: "1.6", // Version de la commande
    author: "Christus x Aesther", // Auteur de la commande
    countDown: 2, // Temps de cooldown en secondes (avant de pouvoir réutiliser la commande)
    role: 0, // Rôle requis pour utiliser la commande (0 = tout le monde, autre chiffre = rôle spécifique)
    description: "Génère une image gay avec les IDs de deux utilisateurs.", // Description de la commande
    category: "fun", // Catégorie de la commande (par exemple, "fun", "utilitaire")
    guide: {
      en: "{pn} @mention @mention\nOu {pn} @mention\nOu répondre à un message." // Instructions d'utilisation de la commande (en anglais)
    }
  },

  onStart: async function ({ api, event }) { // Fonction exécutée lorsque la commande est lancée
    try {
      const mentions = Object.keys(event.mentions || {}); // Récupère les IDs des utilisateurs mentionnés dans le message.
      let uid1, uid2; // Déclare les variables pour les IDs des utilisateurs.
      let uid1Name, uid2Name; // Déclare les variables pour les noms des utilisateurs.

      // Cas 1: Deux mentions ou plus
      if (mentions.length >= 2) {
        uid1 = mentions[0]; // Prend le premier utilisateur mentionné comme uid1
        uid2 = mentions[1]; // Prend le second utilisateur mentionné comme uid2
        uid1Name = event.mentions[uid1]; // Récupère le nom du premier utilisateur mentionné
        uid2Name = event.mentions[uid2]; // Récupère le nom du second utilisateur mentionné
      }
      // Cas 2: Une mention
      else if (mentions.length === 1) {
        uid1 = event.senderID; // L'expéditeur est uid1
        uid2 = mentions[0]; // L'utilisateur mentionné est uid2
        const userInfo = await api.getUserInfo(uid1); // Récupère les informations de l'expéditeur.
        uid1Name = userInfo[uid1]?.name || "User"; // Récupère le nom de l'expéditeur, ou "User" par défaut.
        uid2Name = event.mentions[uid2]; // Récupère le nom de l'utilisateur mentionné.
      }
      // Cas 3: Répondre à un message
      else if (event.messageReply) {
        uid1 = event.senderID; // L'expéditeur est uid1
        uid2 = event.messageReply.senderID; // L'expéditeur du message auquel on répond est uid2
        const userInfo = await api.getUserInfo([uid1, uid2]); // Récupère les informations des deux utilisateurs.
        uid1Name = userInfo[uid1]?.name || "User"; // Récupère le nom de l'expéditeur, ou "User" par défaut.
        uid2Name = userInfo[uid2]?.name || "User"; // Récupère le nom de l'autre utilisateur, ou "User" par défaut.
      }
      // Cas 4: Pas de mention ni de réponse
      else {
        return api.sendMessage("Veuillez répondre à un message ou mentionner un ou deux utilisateurs.", event.threadID, event.messageID); // Envoie un message d'erreur si la commande est mal utilisée.
      }

      const url = `https://neokex-apis.onrender.com/gay?uid1=${uid1}&uid2=${uid2}`; // Crée l'URL de l'API avec les IDs des utilisateurs.
      const response = await axios.get(url, { responseType: 'arraybuffer' }); // Fait une requête GET à l'API pour récupérer l'image.  'arraybuffer' pour récupérer les données binaires.
      const filePath = path.join(__dirname, "cache", `gay_${uid1}_${uid2}.jpg`); // Crée le chemin du fichier temporaire pour l'image.
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary")); // Écrit les données de l'image dans le fichier temporaire.

      const messageBody = `Oh oui ${uid1Name} 💋 ${uid2Name}`; // Crée le corps du message à envoyer avec l'image.
      const messageMentions = [
        { tag: uid1Name, id: uid1 },
        { tag: uid2Name, id: uid2 }
      ]; // Crée les mentions pour le message.

      api.sendMessage({ // Envoie le message avec l'image et les mentions.
        body: messageBody,
        attachment: fs.createReadStream(filePath), // Ajoute l'image en pièce jointe.
        mentions: messageMentions
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID); // Supprime le fichier temporaire après l'envoi.

    } catch (e) {
      console.error("Erreur:", e.message); // Affiche l'erreur dans la console.
      api.sendMessage("❌ Impossible de générer l'image. Veuillez réessayer plus tard.", event.threadID, event.messageID); // Envoie un message d'erreur à l'utilisateur.
    }
  }
};