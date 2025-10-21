const axios = require('axios'); // Importe la librairie axios pour les requêtes HTTP
const jimp = require("jimp"); // Importe la librairie jimp pour la manipulation d'images
const fs = require("fs") // Importe la librairie fs pour l'accès au système de fichiers

module.exports = {
 config: {
 name: "fuck", // Nom de la commande
 aliases: ["fuckimg"], // Alias possibles pour la commande
 version: "1.0", // Version de la commande
 author: "Christus x Aesther", // Auteur de la commande
 countDown: 5, // Délai d'attente en secondes avant de pouvoir réutiliser la commande
 role: 0, // Niveau de rôle requis pour utiliser la commande (0 = tout le monde)
 shortDescription: "", // Description courte de la commande (vide ici)
 longDescription: "", // Description longue de la commande (vide ici)
 category: "18+", // Catégorie de la commande (ici, "18+")
 guide: "{pn}" // Guide d'utilisation de la commande (probablement une variable pour le préfixe de la commande)
 },

 onStart: async function ({ message, event, args }) { // Fonction exécutée lorsque la commande est appelée
 const mention = Object.keys(event.mentions); // Récupère les personnes mentionnées dans l'événement
 if (mention.length == 0) return message.reply("Veuillez mentionner quelqu'un"); // Si aucune mention, renvoie un message demandant de mentionner quelqu'un
 else if (mention.length == 1) { // Si une seule personne est mentionnée
 const one = event.senderID, two = mention[0]; // Récupère l'ID de l'expéditeur et l'ID de la personne mentionnée
 bal(one, two).then(ptth => { message.reply({ body: "「 Hooo baby 🥵💦 」", attachment: fs.createReadStream(ptth) }) }) // Appelle la fonction bal avec les ID, et envoie une réponse avec l'image générée
 } else { // Si deux personnes sont mentionnées
 const one = mention[1], two = mention[0]; // Récupère l'ID de la deuxième mentionnée et l'ID de la première mentionnée (inversion)
 bal(one, two).then(ptth => { message.reply({ body: "", attachment: fs.createReadStream(ptth) }) }) // Appelle la fonction bal avec les ID, et envoie une réponse avec l'image générée (sans texte)
 }
 }
};

async function bal(one, two) { // Fonction asynchrone qui crée l'image
 let avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`) // Lit l'image de profil Facebook de la première personne mentionnée
 avone.circle() // Applique un effet de cercle à l'image
 let avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`) // Lit l'image de profil Facebook de la deuxième personne mentionnée
 avtwo.circle() // Applique un effet de cercle à l'image
 let pth = "fucked.png" // Définit le nom du fichier image généré
 let img = await jimp.read("https://i.ibb.co/YpR7Bpv/image.jpg") // Lit l'image de fond

 img.resize(639, 480).composite(avone.resize(90, 90), 23, 320).composite(avtwo.resize(100, 100), 110, 60); // Redimensionne et combine les images : image de fond + avatars

 await img.writeAsync(pth) // Écrit l'image combinée dans un fichier
 return pth // Renvoie le chemin du fichier image
}