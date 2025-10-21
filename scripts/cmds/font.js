const ax = require("axios"); // Importe la bibliothèque 'axios' pour faire des requêtes HTTP
const apiUrl = "http://65.109.80.126:20409/aryan/font"; // Définit l'URL de l'API pour les polices

module.exports = {
  config: {
    name: "font", // Nom de la commande
    aliases: ["ft"], // Alias de la commande (raccourcis)
    version: "0.0.3", // Version de la commande
    author: "Christus x Aesther", // Auteur de la commande
    countDown: 5, // Délai d'attente en secondes avant de pouvoir réutiliser la commande
    role: 0, // Niveau de rôle requis pour utiliser la commande (0 = tout le monde)
    category: "tools", // Catégorie de la commande (outils)
    shortDescription: "Générateur de texte stylisé", // Courte description de la commande
    longDescription: "Génère du texte stylisé avec différents styles de police.", // Longue description de la commande
    guide: {
      en: "{p}font list\n{p}font <number> <text>" // Guide d'utilisation en anglais (exemples)
    }
  },

  onStart: async function ({ api, event, args }) { // Fonction exécutée lorsque la commande est appelée
    if (!args[0]) { // Si aucun argument n'est fourni
      return api.sendMessage(
        "❌ | Veuillez fournir des arguments.\nUtilisez :\nfont list\nfont <numéro> <texte>", // Message d'erreur et d'aide
        event.threadID, // ID du fil de discussion où la commande a été appelée
        event.messageID // ID du message qui a appelé la commande
      );
    }

    let styles = []; // Initialise un tableau pour stocker les styles de police
    try {
      const r = await ax.get(apiUrl); // Envoie une requête GET à l'API pour récupérer les styles
      styles = r.data.available_styles || []; // Récupère les styles disponibles de la réponse de l'API (ou un tableau vide si erreur)
    } catch {
      return api.sendMessage("❌ | Échec de la récupération des styles de police depuis l'API.", event.threadID, event.messageID); // Message d'erreur si la requête API échoue
    }

    if (args[0].toLowerCase() === "list") { // Si l'argument est "list" (liste des styles)
      let msg = "📜 | Styles de police disponibles :\n\n"; // Préparation du message
      styles.forEach((style, i) => { // Boucle sur les styles et construit le message
        msg += `${i + 1}. ${style}\n`;
      });
      return api.sendMessage(msg, event.threadID, (err, info) => { // Envoie le message contenant la liste des styles
        if (!err) setTimeout(() => api.unsendMessage(info.messageID), 15000); // Supprime le message après 15 secondes (si pas d'erreur)
      }, event.messageID);
    }

    const index = parseInt(args[0]); // Convertit le premier argument en entier (numéro du style)
    if (isNaN(index) || index < 1 || index > styles.length) { // Vérifie si le numéro du style est valide
      return api.sendMessage("❌ | Numéro de style invalide.\nTapez : font list", event.threadID, event.messageID); // Message d'erreur si le numéro est invalide
    }

    const style = styles[index - 1]; // Récupère le style correspondant au numéro fourni
    const text = args.slice(1).join(" "); // Récupère le texte à styliser (tout sauf le numéro du style)
    if (!text) return api.sendMessage("❌ | Veuillez fournir du texte à styliser.", event.threadID, event.messageID); // Message d'erreur si aucun texte n'est fourni

    try {
      const url = `${apiUrl}?style=${style}&text=${encodeURIComponent(text)}`; // Construit l'URL de la requête API avec le style et le texte (encodé)
      const r = await ax.get(url); // Envoie une requête GET à l'API pour styliser le texte
      const styledText = r.data.result || "❌ Erreur API."; // Récupère le texte stylisé de la réponse (ou un message d'erreur)
      return api.sendMessage(styledText, event.threadID, event.messageID); // Envoie le texte stylisé
    } catch {
      return api.sendMessage("❌ | Échec de la récupération du texte stylisé.", event.threadID, event.messageID); // Message d'erreur si la requête API échoue
    }
  }
};