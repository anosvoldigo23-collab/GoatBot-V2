const fs = require("fs-extra"); // Importe la bibliothèque fs-extra pour des opérations de fichiers plus avancées.
const path = require("path"); // Importe la bibliothèque path pour manipuler les chemins de fichiers.
const https = require("https"); // Importe la bibliothèque https pour effectuer des requêtes HTTP sécurisées.

module.exports = {
  config: {
    name: "neko", // Nom de la commande.
    version: "1.0", // Version de la commande.
    author: "Christus x Aesther", // Auteur de la commande.
    countDown: 5, // Délai d'attente en secondes avant de pouvoir réutiliser la commande.
    role: 0, // Niveau de rôle requis (0 = public, d'autres valeurs peuvent indiquer des permissions spécifiques).
    role: 0, // Redondant, le rôle est déjà défini.
    shortDescription: { en: "Envoie une image de neko" }, // Description courte de la commande (en anglais).
    longDescription: { en: "Envoie une image de neko girl mignonne" }, // Description longue de la commande (en anglais).
    category: "fun", // Catégorie de la commande (ex: fun, admin, etc.).
    guide: { en: "+neko" } // Guide d'utilisation de la commande (en anglais).
  },

  onStart: async function({ message }) { // Fonction qui s'exécute quand la commande est appelée.
    const imgUrl = "https://api.waifu.pics/sfw/neko"; // URL de l'API pour récupérer une image de neko.
    const filePath = path.join(__dirname, "cache/neko.jpg"); // Chemin vers le fichier temporaire où l'image sera sauvegardée (dans un dossier 'cache' à l'emplacement du fichier).

    https.get(imgUrl, res => { // Fait une requête GET à l'URL de l'API.
      let data = ""; // Initialise une variable pour stocker les données de la réponse.
      res.on("data", chunk => (data += chunk)); // Accumule les morceaux de données de la réponse.
      res.on("end", () => { // Quand la réponse est entièrement reçue.
        const image = JSON.parse(data).url; // Extrait l'URL de l'image de la réponse JSON.
        const file = fs.createWriteStream(filePath); // Crée un flux d'écriture pour sauvegarder l'image dans le fichier temporaire.
        https.get(image, imgRes => { // Fait une requête GET à l'URL de l'image.
          imgRes.pipe(file); // Envoie l'image reçue dans le flux d'écriture (pour la sauvegarder dans le fichier).
          file.on("finish", () => { // Quand l'image a fini d'être sauvegardée dans le fichier.
            message.reply({ // Envoie une réponse au message de l'utilisateur.
              body: "🐱 𝗔𝗹𝗲𝗿𝘁𝗲 𝗙𝗶𝗹𝗹𝗲 𝗡𝗲𝗸𝗼", // Le corps du message (en français).
              attachment: fs.createReadStream(filePath) // Attache le fichier image à la réponse.
            });
          });
        });
      });
    });
  }
};