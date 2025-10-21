const axios = require("axios"); // Importe la bibliothèque axios pour faire des requêtes HTTP
const fs = require("fs"); // Importe le module fs pour gérer les fichiers
const path = require("path"); // Importe le module path pour gérer les chemins de fichiers

module.exports = {
  config: {
    name: "lyrics", // Nom de la commande
    version: "1.2", // Version de la commande
    author: "Christus x Aesther", // Auteur de la commande
    countDown: 5, // Temps d'attente avant de pouvoir réutiliser la commande (en secondes)
    role: 0, // Rôle requis pour utiliser la commande (0 = tous les utilisateurs)
    shortDescription: "Récupérer les paroles d'une chanson", // Courte description de la commande
    longDescription: "Obtenir les paroles détaillées d'une chanson avec le titre, l'artiste et l'illustration de la pochette.", // Description détaillée de la commande
    category: "search", // Catégorie de la commande (recherche)
    guide: {
      en: "{pn} <song name>\nExample: {pn} apt" // Guide d'utilisation en anglais
    }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" "); // Récupère le nom de la chanson à partir des arguments
    if (!query) {
      return api.sendMessage(
        "⚠️ Veuillez fournir le nom d'une chanson !\nExemple : lyrics apt", // Message d'erreur si aucun nom de chanson n'est fourni
        event.threadID,
        event.messageID
      );
    }

    try {
      const { data } = await axios.get(
        `https://lyricstx.vercel.app/youtube/lyrics?title=${encodeURIComponent(query)}` // Fait une requête HTTP à une API pour récupérer les paroles
      );

      if (!data?.lyrics) {
        return api.sendMessage("❌ Paroles non trouvées.", event.threadID, event.messageID); // Message d'erreur si les paroles ne sont pas trouvées
      }

      const { artist_name, track_name, artwork_url, lyrics } = data; // Extrait les informations des paroles récupérées

      const imgPath = path.join(__dirname, "lyrics.jpg"); // Définit le chemin pour enregistrer l'illustration de la pochette
      const imgResp = await axios.get(artwork_url, { responseType: "stream" }); // Récupère l'illustration de la pochette sous forme de flux
      const writer = fs.createWriteStream(imgPath); // Crée un flux pour écrire l'image dans le fichier

      imgResp.data.pipe(writer); // Copie le flux de l'image dans le fichier

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: `🎼 ${track_name}\n👤 Artiste : ${artist_name}\n\n${lyrics}`, // Envoie les paroles avec le titre, l'artiste et l'illustration
            attachment: fs.createReadStream(imgPath)
          },
          event.threadID,
          () => fs.unlinkSync(imgPath), // Supprime le fichier d'illustration après l'envoi
          event.messageID
        );
      });

      writer.on("error", () => {
        api.sendMessage(
          `🎼 ${track_name}\n👤 Artiste : ${artist_name}\n\n${lyrics}`, // Envoie les paroles sans l'illustration en cas d'erreur
          event.threadID,
          event.messageID
        );
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Erreur : Impossible de récupérer les paroles. Veuillez réessayer plus tard.", event.threadID, event.messageID); // Message d'erreur en cas d'échec de la requête
    }
  }
};