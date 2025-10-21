const axios = require("axios");

module.exports = {
 config: {
 name: "monitor", // Nom de la commande
 version: "1.1.0", // Version de la commande
 author: "Christus x Aesther", // Auteur de la commande
 countDown: 5, // Temps d'attente avant que la commande puisse être réutilisée (en secondes)
 role: 0, // Niveau de rôle requis pour utiliser la commande (0 = tous)
 shortDescription: {
 en: "Créer ou renommer un moniteur de disponibilité" // Description courte (anglais)
 },
 description: {
 en: "Créer un moniteur UptimeRobot ou renommer un existant" // Description détaillée (anglais)
 },
 category: "system", // Catégorie de la commande
 guide: {
 en: "{p}monitor [nom] [url]\n{p}monitor rename [id] [nouveauNom]" // Guide d'utilisation (anglais)
 }
 },

 onStart: async function ({ api, event, args }) {
 if (args.length < 1) {
 return api.sendMessage("❌ Utilisation:\n{p}monitor [nom] [url]\n{p}monitor rename [id] [nouveauNom]", event.threadID, event.messageID);
 }

 const subCommand = args[0].toLowerCase();

 // === Renommer le moniteur ===
 if (subCommand === "rename") {
 if (args.length < 3) {
 return api.sendMessage("❌ Utilisation:\n{p}monitor rename [id] [nouveauNom]", event.threadID, event.messageID);
 }

 const id = args[1];
 const newName = args.slice(2).join(" "); // Récupère le nouveau nom (peut contenir des espaces)

 try {
 const res = await axios.get("https://web-api-delta.vercel.app/upt/rename", {
 params: { id, name: newName }
 });

 const result = res.data;

 if (result.error) {
 return api.sendMessage(`⚠️ Échec du renommage : ${result.error}`, event.threadID, event.messageID);
 }

 const updated = result.data;
 return api.sendMessage(`✅ Moniteur renommé !\n🆔 ID : ${updated.id}\n📛 Nouveau nom : ${updated.name}`, event.threadID, event.messageID);
 } catch (e) {
 return api.sendMessage(`🚫 La requête API a échoué !\n${e.message}`, event.threadID, event.messageID);
 }
 }

 // === Créer un moniteur ===
 if (args.length < 2) {
 return api.sendMessage("❌ Utilisation:\n{p}monitor [nom] [url]", event.threadID, event.messageID);
 }

 const name = args[0];
 const url = args[1];
 const interval = 300; // Intervalle de vérification (en secondes)

 if (!url.startsWith("http")) {
 return api.sendMessage("❌ Veuillez fournir une URL valide !", event.threadID, event.messageID);
 }

 try {
 const res = await axios.get("https://web-api-delta.vercel.app/upt", {
 params: { name, url, interval }
 });

 const result = res.data;

 if (result.error) {
 return api.sendMessage(`⚠️ Erreur : ${result.error}`, event.threadID, event.messageID);
 }

 const monitor = result.data;
 const msg = `✅ Moniteur créé avec succès !\n━━━━━━━━━━━━━━\n🆔 ID : ${monitor.id}\n📛 Nom : ${monitor.name}\n🔗 URL : ${monitor.url}\n⏱️ Intervalle : ${monitor.interval / 60} min\n📶 Statut : ${monitor.status == 1 ? "Actif ✅" : "Inactif ❌"}`;
 return api.sendMessage(msg, event.threadID, event.messageID);
 } catch (e) {
 return api.sendMessage(`🚫 La requête API a échoué !\n${e.message}`, event.threadID, event.messageID);
 }
 }
};