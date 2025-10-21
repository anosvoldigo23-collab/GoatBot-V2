const axios = require('axios'); // Importe la bibliothèque axios pour effectuer des requêtes HTTP.

module.exports = {
  config: {
    name: "prompt", // Nom de la commande : "prompt"
    aliases: ['p'], // Alias de la commande : "p" (raccourci)
    version: "1.0", // Version de la commande
    author: "Christus", // Auteur de la commande
    countDown: 5, // Délai d'attente avant de pouvoir utiliser la commande à nouveau (en secondes)
    role: 0, // Niveau de rôle requis pour utiliser la commande (0 = tous les utilisateurs)
    shortDescription: "Génère une invite d'IA", // Description courte de la commande
    longDescription: "Génère une invite Midjourney basée sur du texte ou une image.", // Description longue de la commande
    category: "𝗔𝗜", // Catégorie de la commande (Intelligence Artificielle)
    guide: { // Guide d'utilisation de la commande
      en: " {pn} <texte>: Génère une invite basée sur le texte."
          + "\n {pn} (répondre à une image): Génère une invite basée sur l'image à laquelle vous répondez."
    }
  },

  onStart: async function({ message, event, args }) { // Fonction exécutée lorsque la commande est appelée
    try {
      let imageUrl; // Déclaration d'une variable pour stocker l'URL de l'image

      // Vérifie si la commande est une réponse à un message et si l'attachement est une photo
      if (event.type === "message_reply" && event.messageReply.attachments[0]?.type === 'photo') {
        imageUrl = event.messageReply.attachments[0].url; // Récupère l'URL de l'image répondue
      } else { // Si ce n'est pas une réponse à une image :
        const promptText = args.join(" "); // Récupère le texte de l'invite (les arguments de la commande)
        if (!promptText) { // Vérifie si aucun texte n'a été fourni
          return message.reply("Veuillez fournir une invite ou répondre à une image."); // Renvoie un message d'erreur si aucun texte n'est donné
        }

        // Envoie une requête GET à l'API pour générer une invite à partir du texte
        const response = await axios.get(`https://nova-apis.onrender.com/prompt?prompt=${encodeURIComponent(promptText)}`);
        if (response.status === 200) { // Si la requête a réussi (code 200)
          return message.reply(response.data.prompt); // Envoie l'invite générée en réponse au message
        }
      }

      // Si imageUrl est définie (si on répond à une image)
      if (imageUrl) {
        // Envoie une requête GET à l'API pour générer une invite à partir de l'image
        const response = await axios.get(`https://nova-apis.onrender.com/prompt?image=${encodeURIComponent(imageUrl)}`);
        if (response.status === 200) { // Si la requête a réussi
          return message.reply(response.data.prompt); // Envoie l'invite générée en réponse au message
        }
      } else { // Si ni texte, ni image
        return message.reply("Entrée invalide. Veuillez fournir une invite ou répondre à une image."); // Message d'erreur
      }
    } catch (error) {
      console.error("Erreur lors de la génération de l'invite:", error); // Affiche l'erreur dans la console
      message.reply("Une erreur s'est produite. Veuillez réessayer plus tard."); // Envoie un message d'erreur à l'utilisateur
    }
  }
};