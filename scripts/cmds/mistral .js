// Importer la bibliothèque axios (pour faire des requêtes HTTP)
const axios = require("axios");

// Exporter le module, qui contient la configuration et la logique de la commande "mistral"
module.exports = {
  // Configuration de la commande
  config: {
    // Nom de la commande (à utiliser dans les messages)
    name: "mistral",
    // Alias de la commande (autres noms utilisables)
    aliases: ["mixtral", "mistralai"],
    // Version de la commande
    version: "1.0",
    // Auteur de la commande
    author: "Christus x Aesther",
    // Temps d'attente avant de pouvoir utiliser à nouveau la commande (en secondes)
    countDown: 5,
    // Rôle requis pour utiliser la commande (0 = tout le monde)
    role: 0,
    // Description courte de la commande (en anglais)
    shortDescription: { en: "Discuter avec Mistral AI" },
    // Description longue de la commande (en anglais)
    longDescription: { en: "Parler avec le modèle Mistral AI (Mixtral-8x7B)." },
    // Catégorie de la commande (pour l'organisation)
    category: "ai",
    // Instructions d'utilisation de la commande (en anglais)
    guide: { en: "Utilisation: !mistral <message>\nExemple: !mistral qui es-tu" }
  },

  // Fonction exécutée lorsque la commande est appelée
  onStart: async function ({ api, event, args }) {
    // Récupérer le message de l'utilisateur
    const prompt = args.join(" ");

    // Vérifier si un message a été fourni
    if (!prompt) {
      // Si aucun message, envoyer un message d'aide
      return api.sendMessage(
        "⚠ Veuillez fournir un message pour commencer à discuter.\nExemple: !mistral qui es-tu",
        event.threadID, // ID du fil de discussion (chat)
        event.messageID // ID du message de l'utilisateur
      );
    }

    // Réagir au message de l'utilisateur avec une horloge (⏳) pour indiquer le traitement
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    // Essayer de contacter l'API Mistral AI
    try {
      // Envoyer une requête GET à l'API, avec le message de l'utilisateur et le modèle à utiliser
      const response = await axios.get("https://arychauhann.onrender.com/api/heurist", {
        params: { prompt, model: "mistralai/mixtral-8x7b-instruct" }
      });

      // Vérifier si la réponse de l'API est valide
      if (!response.data || !response.data.result) {
        // Si la réponse est invalide, réagir avec un X (❌) et envoyer un message d'erreur
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("❌ Mistral AI n'a pas renvoyé de réponse.", event.threadID, event.messageID);
      }

      // Récupérer la réponse de l'API
      const { result } = response.data;

      // Envoyer la réponse de l'AI dans le chat
      api.sendMessage(`${result}`, event.threadID, (err) => {
        // En cas d'erreur lors de l'envoi du message, ne rien faire
        if (err) return;
        // Réagir avec un check (✅) pour indiquer le succès
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      }, event.messageID);

    } catch (err) {
      // En cas d'erreur lors de la requête API (par exemple, problème de réseau)
      console.error(err); // Afficher l'erreur dans la console
      // Réagir avec un X (❌) et envoyer un message d'erreur à l'utilisateur
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("❌ Une erreur s'est produite lors de la communication avec Mistral AI.", event.threadID, event.messageID);
    }
  }
};