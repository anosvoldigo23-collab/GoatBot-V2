const g = require("fca-aryan-nix"); // Importe la bibliothèque fca-aryan-nix (probablement une bibliothèque de bot Facebook)
const a = require("axios"); // Importe la bibliothèque axios (pour les requêtes HTTP)
const u = "http://65.109.80.126:20409/aryan/gpt-4"; // Définit l'URL de l'API GPT-4

module.exports = {
  config: {
    name: "gpt", // Nom de la commande : "gpt"
    aliases: ["aix", "chat"], // Alias de la commande : "aix", "chat"
    version: "0.0.2", // Version de la commande
    author: "Christus x Aesther", // Auteur de la commande
    countDown: 3, // Temps d'attente avant de pouvoir réutiliser la commande (en secondes)
    role: 0, // Rôle requis pour utiliser la commande (0 = tout le monde)
    shortDescription: "Posez des questions à l'IA GPT-4", // Description courte de la commande
    longDescription: "Parlez à l'IA GPT-4 en utilisant l'API mise à jour de Christus", // Description longue de la commande
    category: "IA", // Catégorie de la commande
    guide: "/gpt [votre question]" // Guide d'utilisation de la commande
  },

  onStart: async function({ api, event, args }) {
    // Fonction exécutée au lancement de la commande (lorsqu'elle est appelée)
    const p = args.join(" "); // Récupère les arguments de la commande et les joint en une chaîne
    if (!p) return api.sendMessage("❌ Veuillez fournir une question ou une consigne.", event.threadID, event.messageID); // Vérifie si une question a été fournie, sinon envoie un message d'erreur

    api.setMessageReaction("⏳", event.messageID, () => {}, true); // Ajoute une réaction "En attente" (⏳) au message de l'utilisateur

    try {
      const r = await a.get(`${u}?ask=${encodeURIComponent(p)}`); // Envoie une requête GET à l'API GPT-4 avec la question encodée en URL
      const reply = r.data?.reply; // Récupère la réponse de l'API

      if (!reply) throw new Error("Pas de réponse de l'API GPT."); // Gère l'absence de réponse de l'API

      api.setMessageReaction("✅", event.messageID, () => {}, true); // Remplace la réaction par un "Succès" (✅)

      api.sendMessage(reply, event.threadID, (err, i) => {
        // Envoie la réponse de l'IA au fil de discussion
        if (!i) return;
        global.GoatBot.onReply.set(i.messageID, { commandName: this.config.name, author: event.senderID });
        // Enregistre la réponse pour la gestion des réponses ultérieures (onReply)
      }, event.messageID);

    } catch (e) {
      // Gère les erreurs lors de la requête à l'API
      api.setMessageReaction("❌", event.messageID, () => {}, true); // Ajoute une réaction "Erreur" (❌)
      api.sendMessage("⚠ L'API GPT ne répond pas.", event.threadID, event.messageID); // Envoie un message d'erreur
    }
  },

  onReply: async function({ api, event, Reply }) {
    // Fonction exécutée lorsque l'IA répond à un message précédent
    if ([api.getCurrentUserID()].includes(event.senderID)) return; //  Empêche le bot de répondre à lui-même

    const p = event.body; // Récupère le corps du message de l'utilisateur (la réponse)
    if (!p) return; // Vérifie si le corps du message n'est pas vide.

    api.setMessageReaction("⏳", event.messageID, () => {}, true); // Ajoute une réaction "En attente" (⏳) au message de l'utilisateur

    try {
      const r = await a.get(`${u}?ask=${encodeURIComponent(p)}`); // Envoie une requête GET à l'API GPT-4 avec la question encodée en URL
      const reply = r.data?.reply; // Récupère la réponse de l'API

      if (!reply) throw new Error("Pas de réponse de l'API GPT."); // Gère l'absence de réponse de l'API

      api.setMessageReaction("✅", event.messageID, () => {}, true); // Remplace la réaction par un "Succès" (✅)

      api.sendMessage(reply, event.threadID, (err, i) => {
        // Envoie la réponse de l'IA au fil de discussion
        if (!i) return;
        global.GoatBot.onReply.set(i.messageID, { commandName: this.config.name, author: event.senderID });
        // Enregistre la réponse pour la gestion des réponses ultérieures (onReply)
      }, event.messageID);

    } catch (e) {
      // Gère les erreurs lors de la requête à l'API
      api.setMessageReaction("❌", event.messageID, () => {}, true); // Ajoute une réaction "Erreur" (❌)
      api.sendMessage("⚠ Problème lors de la réponse de l'API GPT.", event.threadID, event.messageID); // Envoie un message d'erreur
    }
  }
};

const w = new g.GoatWrapper(module.exports); // Crée un wrapper pour gérer la commande avec la bibliothèque fca-aryan-nix
w.applyNoPrefix({ allowPrefix: true }); // Applique les paramètres du wrapper (permettant d'utiliser la commande sans préfixe si configuré)