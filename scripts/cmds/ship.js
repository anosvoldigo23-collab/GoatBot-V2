const { resolve } = require("path"); // Importe la fonction 'resolve' du module 'path' pour gérer les chemins de fichiers.
const { existsSync, mkdirSync } = require("fs-extra"); // Importe les fonctions 'existsSync' (vérifie l'existence d'un fichier) et 'mkdirSync' (crée un dossier) du module 'fs-extra'.

module.exports = {
  config: {
    name: "ship", // Nom de la commande (probablement pour un "ship", c'est-à-dire un couple)
    author: "Christus x Aesther", // Auteur de la commande
    countDown: 5, // Délai d'attente avant de pouvoir utiliser à nouveau la commande (en secondes)
    role: 0, // Niveau de rôle requis pour utiliser la commande (0 = tous)
    category: "𝗙𝗨𝗡 & 𝗚𝗔𝗠𝗘", // Catégorie de la commande
    shortDescription: {
      en: "", // Description courte en anglais (vide ici)
    },
  },
  onLoad: async function() {
    const { downloadFile } = global.utils; // Récupère la fonction 'downloadFile' depuis les utils globales.
    const dirMaterial = __dirname + "/cache/canvas/"; // Définit le dossier où seront stockées les images générées.
    const path = resolve(__dirname, "cache/canvas", "pairing.jpg"); // Définit le chemin complet vers l'image de fond pour le "ship".
    if (!existsSync(dirMaterial)) mkdirSync(dirMaterial, { recursive: true }); // Crée le dossier 'dirMaterial' s'il n'existe pas. L'option 'recursive: true' permet de créer tous les dossiers parents nécessaires.
    if (!existsSync(path)) await downloadFile("https://i.pinimg.com/736x/15/fa/9d/15fa9d71cdd07486bb6f728dae2fb264.jpg", path); // Télécharge l'image de fond si elle n'existe pas.
  },
  makeImage: async function({ one, two }) {
    const fs = require("fs-extra"); // Importe le module 'fs-extra' pour la manipulation de fichiers.
    const path = require("path"); // Importe le module 'path' pour la gestion des chemins.
    const axios = require("axios"); // Importe le module 'axios' pour effectuer des requêtes HTTP.
    const jimp = require("jimp"); // Importe le module 'jimp' pour la manipulation d'images.
    const __root = path.resolve(__dirname, "cache", "canvas"); // Définit le dossier racine pour le stockage des images temporaires.

    let pairing_img = await jimp.read(__root + "/pairing.jpg"); // Charge l'image de fond.
    let pathImg = __root + `/pairing_${one}_${two}.png`; // Définit le chemin du fichier image généré.
    let avatarOne = __root + `/avLt_${one}.png`; // Définit le chemin du fichier image de l'avatar de la première personne.
    let avatarTwo = __root + `/avLt_${two}.png`; // Définit le chemin du fichier image de l'avatar de la deuxième personne.

    // Télécharge l'avatar de la première personne depuis Facebook.
    let getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne, 'utf-8')); // Écrit l'avatar téléchargé dans un fichier.

    // Télécharge l'avatar de la deuxième personne depuis Facebook.
    let getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo, 'utf-8')); // Écrit l'avatar téléchargé dans un fichier.

    let circleOne = await jimp.read(await this.circle(avatarOne)); // Crée un avatar rond pour la première personne.
    let circleTwo = await jimp.read(await this.circle(avatarTwo)); // Crée un avatar rond pour la deuxième personne.
    pairing_img.composite(circleOne.resize(85, 85), 355, 100).composite(circleTwo.resize(75, 75), 250, 140); // Superpose les avatars ronds sur l'image de fond.

    let raw = await pairing_img.getBufferAsync("image/png"); // Convertit l'image composite en un buffer PNG.

    fs.writeFileSync(pathImg, raw); // Écrit l'image finale dans un fichier.
    fs.unlinkSync(avatarOne); // Supprime le fichier de l'avatar de la première personne.
    fs.unlinkSync(avatarTwo); // Supprime le fichier de l'avatar de la deuxième personne.

    return pathImg; // Retourne le chemin de l'image générée.
  },
  circle: async function(image) {
    const jimp = require("jimp"); // Importe le module 'jimp'.
    image = await jimp.read(image); // Lit l'image.
    image.circle(); // Transforme l'image en cercle.
    return await image.getBufferAsync("image/png"); // Retourne un buffer PNG de l'image en cercle.
  },
  onStart: async function({ api, event, args, usersData, threadsData }) {
    const axios = require("axios"); // Importe le module 'axios'.
    const fs = require("fs-extra"); // Importe le module 'fs-extra'.
    const { threadID, messageID, senderID } = event; // Récupère les informations de l'événement.
    var tl = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', "0%", "48%"]; // Tableau de pourcentages (probablement pour un effet visuel).
    var tle = tl[Math.floor(Math.random() * tl.length)]; // Sélectionne un pourcentage aléatoire.
    let dataa = await api.getUserInfo(event.senderID); // Récupère les informations de l'utilisateur qui a exécuté la commande.
    let namee = await dataa[event.senderID].name; // Récupère le nom de l'utilisateur.
    let loz = await api.getThreadInfo(event.threadID); // Récupère les informations du fil de discussion (chat).
    var emoji = loz.participantIDs; // Récupère les ID des participants au fil de discussion.
    var id = emoji[Math.floor(Math.random() * emoji.length)]; // Sélectionne un ID de participant au hasard.
    let data = await api.getUserInfo(id); // Récupère les informations de l'utilisateur sélectionné aléatoirement.
    let name = await data[id].name; // Récupère le nom de l'utilisateur sélectionné.
    var arraytag = []; // Initialise un tableau pour les mentions.
    arraytag.push({id: event.senderID, tag: namee}); // Ajoute une mention pour l'utilisateur qui a exécuté la commande.
    arraytag.push({id: id, tag: name}); // Ajoute une mention pour l'utilisateur sélectionné.

    var sex = await data[id].gender; // Récupère le sexe de l'utilisateur sélectionné.
    var gender = sex == 2 ? "Male🧑" : sex == 1 ? "Female👩‍ " : "Tran Duc Bo"; // Détermine le genre en fonction du sexe (0-3).
    var one = senderID, two = id; // Définit les IDs des utilisateurs à utiliser pour la génération de l'image.
    return this.makeImage({one, two}).then(async pathImg => { // Appelle la fonction makeImage pour générer l'image.
      var message = {
        body: `💘${namee} fait un couple avec ${name} ${gender}💘\n\nTag : ${arraytag.map(tag => `@${tag.tag} `).join("")}`, // Crée le corps du message avec les noms et les mentions.
        mentions: arraytag, // Inclut les mentions.
        attachment: fs.createReadStream(pathImg), // Attache l'image générée.
      };
      api.sendMessage(message, threadID, async () => { // Envoie le message dans le fil de discussion.
        try {
          fs.unlinkSync(pathImg); // Supprime l'image générée après l'envoi.
        } catch (e) {
          console.log(e); // En cas d'erreur lors de la suppression, affiche l'erreur dans la console.
        }
      }, messageID);
      return;
    }).catch(e => console.log(e)); // Gère les erreurs éventuelles lors de la génération de l'image.
  },
};