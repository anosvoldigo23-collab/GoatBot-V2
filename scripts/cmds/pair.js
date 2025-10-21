const axios = require("axios"); // Importe la bibliothèque axios pour les requêtes HTTP
const fs = require("fs-extra"); // Importe la bibliothèque fs-extra pour les opérations de fichiers (plus complète que fs de base)

module.exports = {
  config: {
    name: "pair", // Nom de la commande (pour l'appeler)
    aliases: [], // Alias de la commande (noms alternatifs)
    version: "1.0", // Version de la commande
    author: "Christus x Aesther", // Auteur de la commande
    countDown: 5, // Délai d'attente en secondes avant que la commande puisse être réutilisée
    role: 0, // Rôle requis pour utiliser la commande (0 = tous les utilisateurs)
    shortDescription: "", // Courte description de la commande
    longDescription: "", // Description détaillée de la commande
    category: "love", // Catégorie de la commande (ex: amour, utilitaire, etc.)
    guide: "{pn}" // Instructions d'utilisation de la commande (remplacé par le préfixe du bot)
  },

  onStart: async function({ api, event, threadsData, usersData }) {
    // Fonction exécutée lorsque la commande est appelée

    const { threadID, messageID, senderID } = event; // Extrait les informations de l'événement (ID du fil de discussion, ID du message, ID de l'expéditeur)
    const { participantIDs } = await api.getThreadInfo(threadID); // Récupère les ID des participants du fil de discussion
    var tle = Math.floor(Math.random() * 101); // Génère un nombre aléatoire entre 0 et 100 (pour le pourcentage de compatibilité)
    var namee = (await usersData.get(senderID)).name // Récupère le nom de l'expéditeur
    const botID = api.getCurrentUserID(); // Récupère l'ID du bot
    const listUserID = participantIDs.filter(ID => ID != botID && ID != senderID); // Filtre la liste des ID des participants pour ne garder que les autres utilisateurs (pas le bot ni l'expéditeur)
    var id = listUserID[Math.floor(Math.random() * listUserID.length)]; // Choisit aléatoirement un ID d'un autre utilisateur
    var name = (await usersData.get(id)).name // Récupère le nom de l'utilisateur sélectionné

    var arraytag = []; // Crée un tableau pour les mentions (pour taguer les utilisateurs dans le message)
    arraytag.push({ id: senderID, tag: namee }); // Ajoute l'expéditeur au tableau des mentions
    arraytag.push({ id: id, tag: name }); // Ajoute l'utilisateur sélectionné au tableau des mentions

    // Récupère l'avatar de l'expéditeur depuis Facebook
    let Avatar = (await axios.get(`https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(__dirname + "/cache/avt.png", Buffer.from(Avatar, "utf-8")); // Enregistre l'avatar dans un fichier temporaire

    // Récupère une image GIF depuis une URL
    let gifLove = (await axios.get(`https://i.ibb.co/y4dWfQq/image.gif`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(__dirname + "/cache/giflove.png", Buffer.from(gifLove, "utf-8")); // Enregistre le GIF dans un fichier temporaire

    // Récupère l'avatar de l'utilisateur sélectionné depuis Facebook
    let Avatar2 = (await axios.get(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(__dirname + "/cache/avt2.png", Buffer.from(Avatar2, "utf-8")); // Enregistre l'avatar dans un fichier temporaire

    var imglove = []; // Crée un tableau pour les pièces jointes (images)

    imglove.push(fs.createReadStream(__dirname + "/cache/avt.png")); // Ajoute l'avatar de l'expéditeur en pièce jointe
    imglove.push(fs.createReadStream(__dirname + "/cache/giflove.png")); // Ajoute le GIF en pièce jointe
    imglove.push(fs.createReadStream(__dirname + "/cache/avt2.png")); // Ajoute l'avatar de l'utilisateur sélectionné en pièce jointe

    // Crée le message à envoyer
    var msg = {
      body: `🥰 Appariement réussi !\n💌 Je vous souhaite à tous les deux cent ans de bonheur\n💕 Taux de compatibilité: ${tle}%\n${namee} 💓 ${name}`, // Corps du message
      mentions: arraytag, // Mentions des utilisateurs
      attachment: imglove // Pièces jointes (images)
    };

    return api.sendMessage(msg, event.threadID, event.messageID); // Envoie le message dans le fil de discussion
  }
};