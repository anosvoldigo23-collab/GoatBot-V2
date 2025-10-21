const { loadImage, createCanvas } = require("canvas"); // Importe les fonctions pour charger des images et créer des canevas
const fs = require("fs-extra"); // Importe la bibliothèque pour les opérations de fichiers (avec plus de fonctionnalités)
const axios = require("axios"); // Importe la bibliothèque pour effectuer des requêtes HTTP

module.exports = {
 config: {
  name: "hack", // Nom de la commande
  author: "Christus x Aesther", // Auteur de la commande
  countDown: 5, // Temps de refroidissement (en secondes)
  role: 2, // Niveau de rôle requis pour utiliser la commande (peut correspondre à différents niveaux d'autorisation)
  category: "fun", // Catégorie de la commande
  shortDescription: {
   en: "Génère une image de 'piratage' avec la photo de profil de l'utilisateur."
  }
 },

 wrapText: async (ctx, name, maxWidth) => {
  return new Promise((resolve) => {
   if (ctx.measureText(name).width < maxWidth) return resolve([name]); // Si le texte tient sur une seule ligne, on retourne le texte tel quel
   if (ctx.measureText("W").width > maxWidth) return resolve(null); // Si la largeur d'un "W" dépasse la largeur maximale, on retourne null
   const words = name.split(" "); // Sépare le nom en mots
   const lines = []; // Initialise un tableau pour stocker les lignes
   let line = ""; // Initialise une chaîne de caractères pour construire la ligne actuelle
   while (words.length > 0) { // Tant qu'il reste des mots
    let split = false; // Initialise une variable pour indiquer si un mot a été coupé
    while (ctx.measureText(words[0]).width >= maxWidth) { // Tant que le premier mot dépasse la largeur maximale
     const temp = words[0]; // Stocke le premier mot dans une variable temporaire
     words[0] = temp.slice(0, -1); // Coupe le dernier caractère du mot
     if (split) words[1] = `${temp.slice(-1)}${words[1]}`; // Si le mot a déjà été coupé, ajoute le dernier caractère à la deuxième partie
     else {
      split = true; // Indique que le mot a été coupé
      words.splice(1, 0, temp.slice(-1)); // Insère le dernier caractère du mot comme nouveau mot
     }
    }
    if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) // Si en ajoutant le prochain mot à la ligne actuelle, la largeur ne dépasse pas la largeur maximale
     line += `${words.shift()} `; // Ajoute le mot à la ligne et le retire du tableau des mots
    else {
     lines.push(line.trim()); // Sinon, ajoute la ligne actuelle (après avoir supprimé les espaces en trop) au tableau des lignes
     line = ""; // Réinitialise la ligne actuelle
    }
    if (words.length === 0) lines.push(line.trim()); // Si il n'y a plus de mots, ajoute la dernière ligne (après avoir supprimé les espaces en trop) au tableau des lignes
   }
   return resolve(lines); // Retourne le tableau des lignes
  });
 },

 onStart: async function ({ api, event }) {
  let pathImg = __dirname + "/cache/background.png"; // Définit le chemin vers le fichier d'arrière-plan (dans le dossier "cache")
  let pathAvt1 = __dirname + "/cache/Avtmot.png"; // Définit le chemin vers le fichier de la photo de profil (dans le dossier "cache")
  var id = Object.keys(event.mentions)[0] || event.senderID; // Récupère l'ID de l'utilisateur mentionné, sinon l'ID de l'expéditeur
  var name = await api.getUserInfo(id); // Récupère les informations de l'utilisateur (nom)
  name = name[id].name; // Récupère le nom de l'utilisateur
  var background = [
   "https://drive.google.com/uc?id=1RwJnJTzUmwOmP3N_mZzxtp63wbvt9bLZ" // URL de l'image d'arrière-plan
  ];
  var rd = background[Math.floor(Math.random() * background.length)]; // Sélectionne une URL d'arrière-plan aléatoire
  let getAvtmot = ( // Récupère la photo de profil de l'utilisateur
   await axios.get(
    `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, // URL de l'API Facebook pour récupérer la photo de profil
    { responseType: "arraybuffer" } // Définit le type de réponse comme un tableau d'octets
   )
  ).data; // Récupère les données de la réponse
  fs.writeFileSync(pathAvt1, Buffer.from(getAvtmot, "utf-8")); // Écrit les données de la photo de profil dans le fichier
  let getbackground = ( // Récupère l'image d'arrière-plan
   await axios.get(`${rd}`, {
    responseType: "arraybuffer", // Définit le type de réponse comme un tableau d'octets
   })
  ).data; // Récupère les données de la réponse
  fs.writeFileSync(pathImg, Buffer.from(getbackground, "utf-8")); // Écrit les données de l'arrière-plan dans le fichier
  let baseImage = await loadImage(pathImg); // Charge l'image d'arrière-plan dans un objet
  let baseAvt1 = await loadImage(pathAvt1); // Charge la photo de profil dans un objet
  let canvas = createCanvas(baseImage.width, baseImage.height); // Crée un canevas avec la même taille que l'image d'arrière-plan
  let ctx = canvas.getContext("2d"); // Obtient le contexte 2D du canevas
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height); // Dessine l'image d'arrière-plan sur le canevas
  ctx.font = "400 23px Arial"; // Définit la police et la taille du texte
  ctx.fillStyle = "#1878F3"; // Définit la couleur du texte
  ctx.textAlign = "start"; // Définit l'alignement du texte
  const lines = await this.wrapText(ctx, name, 1160); // Appelle la fonction pour envelopper le nom du texte
  ctx.fillText(lines.join("\n"), 200, 497); // Dessine le nom enveloppé sur le canevas
  ctx.beginPath(); // Début d'un nouveau tracé
  ctx.drawImage(baseAvt1, 83, 437, 100, 101); // Dessine la photo de profil sur le canevas
  const imageBuffer = canvas.toBuffer(); // Convertit le canevas en un tampon d'image
  fs.writeFileSync(pathImg, imageBuffer); // Écrit le tampon d'image dans le fichier
  fs.removeSync(pathAvt1); // Supprime le fichier de la photo de profil
  return api.sendMessage( // Envoie un message à la conversation
   {
    body: "✅ Utilisateur piraté avec succès! Veuillez consulter l'image.", // Corps du message
    attachment: fs.createReadStream(pathImg), // Attache l'image générée
   },
   event.threadID, // ID de la conversation
   () => fs.unlinkSync(pathImg), // Supprime le fichier d'image après l'envoi du message
   event.messageID // ID du message original
  );
 },
};