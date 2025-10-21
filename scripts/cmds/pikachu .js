const axios = require("axios"); // Importe la bibliothèque axios pour faire des requêtes HTTP.
const fs = require("fs"); // Importe la bibliothèque fs pour manipuler le système de fichiers.
const path = require("path"); // Importe la bibliothèque path pour manipuler les chemins de fichiers.

module.exports = {
 config: {
  name: "pikachu", // Le nom de la commande (pikachu).
  version: "1.0", // La version de la commande.
  author: "Christus x Aesther", // L'auteur de la commande.
  countDown: 5, // Un compte à rebours (en secondes ?) avant que la commande puisse être utilisée à nouveau.
  role: 0, // Le rôle requis pour utiliser la commande (0 généralement signifie tout le monde).
  shortDescription: {
   en: "Génère une image de Pikachu avec du texte personnalisé" // Brève description de la commande en anglais.
  },
  description: {
   en: "Crée une image mignonne de Pikachu avec le texte que vous fournissez" // Description détaillée de la commande en anglais.
  },
  category: "fun", // La catégorie de la commande (amusant).
  guide: {
   en: "{p}pikachu <texte>\nExemple: {p}pikachu bonjour" // Instructions d'utilisation de la commande en anglais.
  }
 },

 langs: {
  en: {
   missing: "❌ | Veuillez fournir du texte à mettre sur l'image de Pikachu.", // Message d'erreur si aucun texte n'est fourni.
   error: "❌ | Échec de la génération de l'image de Pikachu." // Message d'erreur si la génération de l'image échoue.
  }
 },

 onStart: async function ({ message, args, getLang }) {
  if (!args.length) return message.reply(getLang("missing")); // Si aucun argument n'est fourni, répond avec le message "missing".

  const text = encodeURIComponent(args.join(" ")); // Encode le texte fourni pour l'utiliser dans l'URL.

  try {
   const res = await axios.get(`https://api.popcat.xyz/v2/pikachu?text=${text}`, { // Fait une requête GET à l'API pour générer l'image de Pikachu.
    responseType: "arraybuffer" // Spécifie le type de réponse comme un tableau d'octets (pour les images).
   });

   const filePath = path.join(__dirname, "cache", `pikachu_${Date.now()}.png`); // Définit le chemin du fichier pour sauvegarder l'image temporairement.
   fs.writeFileSync(filePath, res.data); // Écrit les données de l'image dans le fichier.

   message.reply({
    body: `⚡ Voici votre image de Pikachu !`, // Envoie un message avec l'image générée.
    attachment: fs.createReadStream(filePath) // Attache l'image à la réponse.
   }, () => fs.unlinkSync(filePath)); // Supprime le fichier image temporaire une fois qu'il est envoyé.
  } catch (err) {
   console.error(err); // Affiche les erreurs dans la console.
   message.reply(getLang("error")); // Envoie un message d'erreur à l'utilisateur.
  }
 }
};