const axios = require("axios"); // Importe la bibliothèque axios pour effectuer des requêtes HTTP.
const fs = require("fs"); // Importe la bibliothèque fs pour interagir avec le système de fichiers.
const path = require("path"); // Importe la bibliothèque path pour gérer les chemins de fichiers.

const CACHE_DIR = path.join(__dirname, "cache"); // Définit le dossier de cache où les images générées seront stockées.

module.exports = {
 config: {
  name: "gen", // Nom de la commande.
  aliases: ["ai4image"], // Alias pour la commande (autres noms qui peuvent être utilisés pour appeler la commande).
  version: "1.1", // Version de la commande.
  author: "Christus x Aesther", // Auteur de la commande.
  countDown: 5, // Délai d'attente avant de pouvoir réutiliser la commande (en secondes).
  role: 0, // Niveau de rôle requis pour utiliser la commande (0 généralement pour tout le monde).
  shortDescription: { en: "Générer des images IA en utilisant Gen AI" }, // Description courte de la commande (en anglais).
  longDescription: { en: "Envoyez une invite textuelle et éventuellement un ratio d'aspect pour générer une image IA en utilisant l'API Christus AI4Image." }, // Description longue de la commande (en anglais).
  category: "ai", // Catégorie de la commande (ici, IA).
  guide: { en: "{pn} <prompt> [--ar=1:1]\n\nExample:\n{pn} cute cat in a garden --ar=16:9" } // Guide d'utilisation de la commande (en anglais).
 },

 onStart: async function ({ api, args, event }) {
  // Fonction qui s'exécute lorsque la commande est appelée.
  if (!args[0]) return api.sendMessage("❌ Veuillez fournir une invite pour Gen AI.", event.threadID, event.messageID);
  // Vérifie si une invite (texte descriptif de l'image) a été fournie. Sinon, renvoie un message d'erreur.

  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  // Crée le dossier de cache s'il n'existe pas. L'option "recursive: true" permet de créer les dossiers parents si nécessaire.

  let ratio = "1:1";
  // Définit le ratio d'aspect par défaut à 1:1 (carré).
  const argStr = args.join(" ");
  // Regroupe les arguments de la commande en une seule chaîne de caractères.

  const arMatch = argStr.match(/--?ar[=\s]+([0-9]+:[0-9]+)/i);
  // Recherche dans les arguments un ratio d'aspect spécifié avec --ar= ou -ar= ou --ar ou -ar.
  if (arMatch) ratio = arMatch[1];
  // Si un ratio d'aspect est trouvé, met à jour la variable `ratio`.

  const prompt = argStr.replace(/--?ar[=\s]+([0-9]+:[0-9]+)/i, "").trim();
  // Extrait l'invite de texte en supprimant le ratio d'aspect et en enlevant les espaces en trop.

  if (!prompt) return api.sendMessage("❌ Veuillez fournir une invite valide.", event.threadID, event.messageID);
  // Vérifie si l'invite est valide après le nettoyage. Si ce n'est pas le cas, renvoie un message d'erreur.

  api.setMessageReaction("⏳", event.messageID, () => {}, true);
  // Ajoute une réaction "⏳" (en attente) au message de l'utilisateur.

  try {
   const apiUrl = `https://aryanapi.up.railway.app/api/ai4image?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}`;
   // Construit l'URL de l'API avec l'invite et le ratio d'aspect. Les valeurs sont encodées pour une utilisation sûre dans l'URL.
   const res = await axios.get(apiUrl, { timeout: 30000 });
   // Effectue une requête GET à l'API pour générer l'image.  Timeout de 30 secondes.
   const imageUrl = res.data?.result?.image_link;
   // Récupère l'URL de l'image générée à partir de la réponse de l'API.

   if (!imageUrl) {
    return api.sendMessage("❌ Échec de la génération de l'image Gen AI.", event.threadID, event.messageID);
    // Si l'URL de l'image n'est pas trouvée, renvoie un message d'erreur.
   }

   const fileRes = await axios.get(imageUrl, { responseType: "stream" });
   // Télécharge l'image depuis l'URL de l'image.  `responseType: "stream"` permet de traiter la réponse en streaming.
   const filename = `genai_${Date.now()}.jpeg`;
   // Crée un nom de fichier unique pour l'image.
   const filepath = path.join(CACHE_DIR, filename);
   // Crée le chemin complet du fichier où l'image sera enregistrée.
   const writer = fs.createWriteStream(filepath);
   // Crée un flux d'écriture pour enregistrer l'image dans le fichier.

   fileRes.data.pipe(writer);
   // Copie les données de l'image téléchargée dans le flux d'écriture.

   writer.on("finish", () => {
    // Quand l'écriture est terminée :
    api.sendMessage({
     body: `✨ Image Gen AI générée pour l'invite: "${prompt}"\n📐 Ratio: ${ratio}`,
     attachment: fs.createReadStream(filepath)
    }, event.threadID, () => {
     // Envoie l'image générée à l'utilisateur.
     try { fs.unlinkSync(filepath); } catch {}
     // Supprime le fichier image du cache après l'envoi.  Un bloc `try...catch` gère les erreurs potentielles.
    }, event.messageID);

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    // Ajoute une réaction "✅" (succès) au message de l'utilisateur.
   });

   writer.on("error", (err) => {
    // Si une erreur se produit pendant l'écriture du fichier :
    console.error("❌ Erreur d'écriture du fichier:", err.message);
    // Affiche l'erreur dans la console.
    api.sendMessage("❌ Erreur lors de l'enregistrement de l'image Gen AI.", event.threadID, event.messageID);
    // Envoie un message d'erreur à l'utilisateur.
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    // Ajoute une réaction "❌" (erreur) au message de l'utilisateur.
   });

  } catch (err) {
   // Si une erreur se produit lors de la génération de l'image (requête API, etc.) :
   console.error("❌ Erreur lors de la génération de l'image Gen AI:", err.message);
   // Affiche l'erreur dans la console.
   api.sendMessage("❌ Échec de la génération de l'image Gen AI.", event.threadID, event.messageID);
   // Envoie un message d'erreur à l'utilisateur.
   api.setMessageReaction("❌", event.messageID, () => {}, true);
   // Ajoute une réaction "❌" (erreur) au message de l'utilisateur.
  }
 }
};