const axios = require('axios'); // Importe la bibliothèque axios pour les requêtes HTTP

module.exports = {
  config: {
    name: "imagine", // Nom de la commande
    aliases: ["ima"], // Alias de la commande (raccourcis)
    version: "0.0.1", // Version de la commande
    author: "Christus x Aesther", // Auteur de la commande
    countDown: 5, // Temps d'attente en secondes avant de pouvoir utiliser à nouveau la commande
    role: 0, // Rôle requis pour utiliser la commande (0 signifie pas de restriction)
    shortDescription: {
      en: "Generate image using AI" // Brève description en anglais
    },
    longDescription: {
      en: "Send a prompt to the AI image generation API and get back an image." // Description détaillée en anglais
    },
    category: "ai", // Catégorie de la commande (ici, 'ai' pour intelligence artificielle)
    guide: {
      en: "{pn} [prompt text]" // Guide d'utilisation en anglais (syntaxe)
    }
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" "); // Récupère le texte de l'invite (le texte que l'utilisateur entre après la commande)
    if (!prompt) {
      return api.sendMessage( // Si l'utilisateur n'a pas fourni d'invite, on affiche un message d'erreur
        "❌ Veuillez fournir une invite.\nExemple: imaginez un magnifique coucher de soleil sur les montagnes",
        event.threadID, // Identifiant du fil de discussion
        event.messageID // Identifiant du message de l'utilisateur
      );
    }

    api.setMessageReaction("🍓", event.messageID, () => {}, true); // Ajoute une réaction "fraise" au message de l'utilisateur pour indiquer que le traitement a commencé

    const apiUrl = `http://65.109.80.126:20409/aryan/imagine?prompt=${encodeURIComponent(prompt)}`; // Construit l'URL de l'API avec l'invite encodée pour le web (pour éviter les problèmes avec les caractères spéciaux)

    try {
      const response = await axios.get(apiUrl, { responseType: 'stream' }); // Effectue une requête GET à l'API, en demandant une réponse en flux (pour gérer l'image)

      await api.sendMessage({ // Envoie l'image générée à l'utilisateur
        body: `✅ voici l'Image que vous aviez demandé!\n\n📝 Invite: ${prompt}`, // Corps du message (texte)
        attachment: response.data // Attache l'image (flux de données)
      }, event.threadID, null, event.messageID);

      api.setMessageReaction("✅", event.messageID, () => {}, true); // Ajoute une réaction "coche verte" au message pour indiquer le succès

    } catch (error) {
      console.error("AI Image API Error:", error.message || error); // Affiche l'erreur dans la console (pour le développeur)
      api.setMessageReaction("❌", event.messageID, () => {}, true); // Ajoute une réaction "croix rouge" au message pour indiquer l'échec
      api.sendMessage("⚠ La génération d'image a échoué depuis l'API AI.", event.threadID, event.messageID); // Envoie un message d'erreur à l'utilisateur
    }
  }
};