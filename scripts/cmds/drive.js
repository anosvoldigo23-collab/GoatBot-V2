const a = require('axios');
const u = "http://65.109.80.126:20409/aryan/drive";

module.exports = {
  config: {
    name: "drive",
    version: "0.0.2",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: "Téléversez facilement des vidéos sur Google Drive !",
    category: "Utilitaire",
    guide: "Utilisation : {pn} <lien> pour téléverser une vidéo depuis un lien\nOu répondez à une vidéo/message contenant un média pour téléverser"
  },

  onStart: async function ({ message, event, args }) {
    const i = event?.messageReply?.attachments?.[0]?.url || args[0];

    if (!i) return message.reply("⚠ Veuillez fournir une URL de vidéo valide ou répondre à un message contenant un média.");

    try {
      const r = await a.get(`${u}?url=${encodeURIComponent(i)}`);
      const d = r.data || {};
      console.log("Réponse de l'API :", d);

      const l = d.driveLink || d.driveLIink;
      if (l) return message.reply(`✅ Fichier téléversé sur Google Drive !\n\n🔗 URL : ${l}`);

      const e = d.error || JSON.stringify(d) || "❌ Échec du téléversement du fichier.";
      return message.reply(`Échec du téléversement : ${e}`);
    } catch (e) {
      console.error("Erreur de téléversement :", e.message || e);
      return message.reply("❌ Une erreur est survenue lors du téléversement. Veuillez réessayer plus tard.");
    }
  }
};