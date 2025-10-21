module.exports = {
 config: {
  name: "listbox", // Nom de la commande
  version: "1.0.0", // Version de la commande
  author: "Christus x Aesther", // Auteur de la commande
  role: 2, // Rôle requis pour utiliser la commande (exemple : 2 représente un certain niveau d'autorisation)
  countDown: 10, // Délai d'attente avant que la commande puisse être utilisée à nouveau (en secondes)
  shortDescription: {
   en: "Liste tous les groupes dans lesquels le bot est présent", // Description courte en anglais
  },
  longDescription: {
   en: "Affiche tous les noms de groupes et leurs identifiants de conversation (Thread ID) où le bot est membre.", // Description longue en anglais
  },
  category: "system", // Catégorie de la commande (ex : système)
  guide: {
   en: "{pn}", // Instructions d'utilisation (en anglais - probablement un placeholder pour le préfixe de la commande)
  },
 },

 onStart: async function ({ api, event }) {
  try {
   // Récupère la liste des conversations (groupes et discussions individuelles)
   const threads = await api.getThreadList(100, null, ["INBOX"]); // Récupère jusqu'à 100 conversations, filtre sur les boîtes de réception

   // Filtre pour ne garder que les groupes (isGroup = true) qui ont un nom et un ID
   const groupThreads = threads.filter(
    (t) => t.isGroup && t.name && t.threadID
   );

   // Si aucun groupe n'est trouvé, envoie un message d'erreur
   if (groupThreads.length === 0) {
    return api.sendMessage("❌ Aucun groupe trouvé.", event.threadID, event.messageID);
   }

   // Construit le message à envoyer
   let msg = `🎯 𝗧𝗼𝘁𝗮𝗹 𝗚𝗿𝗼𝘂𝗽𝗲𝘀: ${groupThreads.length}\n━━━━━━━━━━━━━━\n`; // Affiche le nombre total de groupes

   // Itère sur chaque groupe pour construire la liste détaillée
   groupThreads.forEach((group, index) => {
    msg += `📦 𝗚𝗿𝗼𝘂𝗽 ${index + 1}:\n`; // Numéro du groupe
    msg += `📌 𝗡𝗼𝗺: ${group.name}\n`; // Nom du groupe
    msg += `🆔 𝗧𝗵𝗿𝗲𝗮𝗱 𝗜𝗗: ${group.threadID}\n`; // ID du groupe
    msg += `━━━━━━━━━━━━━━\n`;
   });

   // Envoie le message contenant la liste des groupes
   await api.sendMessage(msg, event.threadID, event.messageID);
  } catch (error) {
   // Gère les erreurs et envoie un message d'erreur à l'utilisateur
   return api.sendMessage(
    `⚠ Erreur lors de la récupération de la liste des groupes:\n${error.message}`,
    event.threadID,
    event.messageID
   );
  }
 },
};