// Importation des modules nécessaires
const axios = require("axios"); // Pour effectuer des requêtes HTTP
const fs = require("fs-extra"); // Pour manipuler les fichiers (version améliorée de 'fs')
const path = require("path"); // Pour manipuler les chemins de fichiers

// Fonction asynchrone pour récupérer l'URL de base de l'API
const baseApiUrl = async () => {
  // Requête GET pour récupérer le fichier JSON contenant l'URL de base
  const base = await axios.get(
    `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`,
  );
  // Retourne l'URL de l'API contenue dans le fichier JSON
  return base.data.api;
};

// Exportation d'un objet contenant la configuration et la fonction principale du module
module.exports = {
  config: {
    name: "pin", // Nom de la commande
    aliases: ["pinterest"], // Alias de la commande (autres noms possibles pour l'appeler)
    version: "1.0", // Version du module
    author: "Christus x Aesther", // Auteur du module
    countDown: 15, // Délai d'attente en secondes avant de pouvoir réutiliser la commande
    role: 0, // Niveau d'autorisation requis pour utiliser la commande (0 pour tous les utilisateurs)
    shortDescription: "Recherche d'images Pinterest", // Description courte de la commande
    longDescription: "Recherche d'images Pinterest", // Description longue de la commande
    category: "download", // Catégorie à laquelle appartient la commande
    guide: {
      en: "{pn} query", // Aide pour utiliser la commande (en anglais)
    },
  },

  onStart: async function ({ api, event, args }) {
    // Fonction exécutée lorsque la commande est appelée

    // Sépare la requête de recherche et le nombre d'images à récupérer
    const queryAndLength = args.join(" ").split("-");
    const q = queryAndLength[0].trim(); // Requête de recherche
    const length = queryAndLength[1].trim(); // Nombre d'images à récupérer

    // Vérifie si la requête et le nombre d'images sont fournis
    if (!q || !length) {
      // Si l'un des deux est manquant, envoie un message d'erreur
      return api.sendMessage(
        "❌| Format incorrect",
        event.threadID,
        event.messageID,
      );
    }

    try {
      // Envoie un message "Veuillez patienter..."
      const w = await api.sendMessage("Veuillez patienter...", event.threadID);

      // Effectue une requête à l'API Pinterest avec la requête et le nombre d'images spécifiés
      const response = await axios.get(
        `${await baseApiUrl()}/pinterest?search=${encodeURIComponent(q)}&limit=${encodeURIComponent(length)}`,
      );
      // Récupère les données (les URLs des images) à partir de la réponse de l'API
      const data = response.data.data;

      // Vérifie si des images ont été trouvées
      if (!data || data.length === 0) {
        // Si aucune image n'est trouvée, envoie un message d'erreur
        return api.sendMessage(
          "Aucune réponse ou aucune image trouvée.",
          event.threadID,
          event.messageID,
        );
      }

      // Initialise un tableau pour stocker les flux de fichiers
      const diptoo = [];
      // Calcule le nombre total d'images à télécharger (en limitant au nombre demandé)
      const totalImagesCount = Math.min(data.length, parseInt(length));

      // Boucle pour télécharger et traiter chaque image
      for (let i = 0; i < totalImagesCount; i++) {
        // Récupère l'URL de l'image
        const imgUrl = data[i];
        // Effectue une requête GET pour télécharger l'image en tant que tableau d'octets
        const imgResponse = await axios.get(imgUrl, {
          responseType: "arraybuffer",
        });
        // Crée le chemin du fichier local où l'image sera sauvegardée
        const imgPath = path.join(
          __dirname, // Répertoire courant
          "dvassests", // Sous-répertoire "dvassests"
          `${i + 1}.jpg`, // Nom de fichier (1.jpg, 2.jpg, etc.)
        );
        // Écrit les données de l'image dans le fichier local
        await fs.outputFile(imgPath, imgResponse.data);
        // Crée un flux de lecture à partir du fichier local et l'ajoute au tableau
        diptoo.push(fs.createReadStream(imgPath));
      }

      // Supprime le message "Veuillez patienter..."
      await api.unsendMessage(w.messageID);
      // Envoie un message avec les images en pièces jointes
      await api.sendMessage(
        {
          body: `
✅ | Voici les images correspondant à votre recherche
✏️ | Nombre total d'images : ${totalImagesCount}`,
          attachment: diptoo, // Attache les flux de fichiers (images)
        },
        event.threadID,
        event.messageID,
      );
    } catch (error) {
      // Gère les erreurs potentielles
      console.error(error); // Affiche l'erreur dans la console
      // Envoie un message d'erreur à l'utilisateur
      await api.sendMessage(
        `Erreur: ${error.message}`,
        event.threadID,
        event.messageID,
      );
    }
  },
};