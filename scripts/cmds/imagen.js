const axios = require("axios"); // Importe la bibliothèque axios pour faire des requêtes HTTP.
const fs = require("fs"); // Importe le module fs pour les opérations de système de fichiers.
const path = require("path"); // Importe le module path pour gérer les chemins de fichiers.

const CACHE_DIR = path.join(__dirname, "cache"); // Définit le répertoire de cache pour stocker les images générées. Il se trouve dans un dossier "cache" à côté du fichier actuel.

module.exports = { // Exporte un objet qui contient la configuration et la fonction principale du module.
 config: { // Configuration du module.
  name: "imagen", // Nom de la commande (imagen).
  version: "1.0", // Version du module.
  author: "Christus x Aesther", // Auteur du module.
  countDown: 5, // Délai d'attente avant de pouvoir utiliser à nouveau la commande (en secondes).
  role: 0, // Niveau de permission requis (0 = public, d'autres valeurs potentiellement pour les administrateurs ou les utilisateurs spéciaux).
  shortDescription: { en: "Génère des images IA utilisant Imagen (stream)" }, // Description courte de la commande (en anglais et en français).
  longDescription: { en: "Envoie une invite et le bot générera une image en utilisant l'API Imagen (API Aryan), prend en charge le téléchargement en flux." }, // Description plus longue de la commande.
  category: "ai", // Catégorie de la commande (intelligence artificielle).
  guide: { en: "{pn} <invite>\n\nExemple:\n{pn} chat dans un jardin" } // Guide d'utilisation de la commande (en anglais et en français), {pn} représente le préfixe de la commande.
 },

 onStart: async function ({ api, args, event }) { // Fonction principale qui s'exécute lorsque la commande est appelée.  Elle prend l'objet 'api' pour interagir avec le bot, 'args' qui contient les arguments de la commande, et 'event' qui contient les informations sur l'événement (par exemple, le message envoyé).
  if (!args[0]) return api.sendMessage("❌ Veuillez fournir une invite pour Imagen.", event.threadID, event.messageID); // Si aucun argument n'est fourni, envoie un message d'erreur.

  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true }); // Crée le répertoire de cache s'il n'existe pas.  `recursive: true` permet de créer les dossiers parents si nécessaire.

  const prompt = args.join(" "); // Concatène tous les arguments en une seule chaîne, qui représente l'invite de l'utilisateur.
  api.setMessageReaction("⏳", event.messageID, () => {}, true); // Ajoute une réaction "⏳" (sablier) au message de l'utilisateur pour indiquer que la requête est en cours.  Le deuxième argument est l'ID du message, le troisième est une fonction de rappel, et le quatrième `true` force la réaction.

  try { // Commence un bloc try/catch pour gérer les erreurs potentielles.
   const apiUrl = `https://aryanapi.up.railway.app/api/imgen?prompt=${encodeURIComponent(prompt)}`; // Construit l'URL de l'API Imagen avec l'invite encodée pour éviter les problèmes de caractères spéciaux.

   const res = await axios.get(apiUrl, { responseType: "stream", timeout: 60000 }); // Fait une requête GET à l'API. `responseType: "stream"` indique qu'on veut recevoir la réponse en flux continu (pour éviter de charger toute l'image en mémoire). `timeout: 60000` définit un délai d'attente de 60 secondes.

   const filename = `imagen_${Date.now()}.jpeg`; // Crée un nom de fichier unique basé sur la date et l'heure actuelles.
   const filepath = path.join(CACHE_DIR, filename); // Construit le chemin complet du fichier dans le répertoire de cache.
   const writer = fs.createWriteStream(filepath); // Crée un flux d'écriture vers le fichier.

   res.data.pipe(writer); // Envoie le flux de données de la réponse de l'API vers le flux d'écriture du fichier.

   writer.on("finish", () => { // Définit un gestionnaire d'événement pour l'événement "finish" du flux d'écriture (lorsque l'écriture du fichier est terminée).
    api.sendMessage({ // Envoie un message avec l'image générée.
     body: `✨ Image IA Imagen générée pour l'invite: "${prompt}"`, // Corps du message.
     attachment: fs.createReadStream(filepath) // Attachement de l'image (lue depuis le fichier).
    }, event.threadID, () => { // Envoie le message dans le fil de discussion de l'événement.
     try { fs.unlinkSync(filepath); } catch {} // Supprime le fichier image du cache après l'envoi du message (pour nettoyer). Un bloc `try/catch` gère les éventuelles erreurs lors de la suppression.
    }, event.messageID);

    api.setMessageReaction("✅", event.messageID, () => {}, true); // Ajoute une réaction "✅" (coche) au message pour indiquer le succès.
   });

   writer.on("error", (err) => { // Définit un gestionnaire d'événement pour l'événement "error" du flux d'écriture (en cas d'erreur lors de l'écriture du fichier).
    console.error("❌ Erreur d'écriture du fichier:", err.message); // Affiche l'erreur dans la console.
    api.sendMessage("❌ Erreur lors de l'enregistrement de l'image IA Imagen.", event.threadID, event.messageID); // Envoie un message d'erreur à l'utilisateur.
    api.setMessageReaction("❌", event.messageID, () => {}, true); // Ajoute une réaction "❌" (croix) au message.
   });

  } catch (err) { // Capture les erreurs qui se sont produites dans le bloc try.
   console.error("❌ Erreur de génération de l'image IA Imagen:", err.message); // Affiche l'erreur dans la console.
   api.sendMessage("❌ Échec de la génération de l'image IA Imagen.", event.threadID, event.messageID); // Envoie un message d'erreur à l'utilisateur.
   api.setMessageReaction("❌", event.messageID, () => {}, true); // Ajoute une réaction "❌" (croix) au message.
  }
 }
};