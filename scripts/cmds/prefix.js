const g = require("fca-aryan-nix");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "prefix",
    version: "3.9",
    author: "Christus",
    countDown: 3,
    role: 0,
    category: "Utility",
    shortDescription: { fr: "🎯 Affiche le préfixe du bot et les infos utilisateur" },
    longDescription: { fr: "Montre le préfixe actif, ton profil et le total des commandes." },
    guide: { fr: "Utilise simplement 'prefix'." },
    noPrefix: true
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const { threadID, senderID } = event;
      const userInfo = await usersData.get(senderID);
      const userName = userInfo?.name || "Utilisateur Inconnu";
      const gender = userInfo?.gender === 2 ? "👨 Homme" : userInfo?.gender === 1 ? "👩 Femme" : "❓ Inconnu";

      // Données du bot
      const prefix = global.GoatBot.config.prefix || "+";
      const totalCmd = global.GoatBot.commands?.size || 0;
      const date = moment().tz("Africa/Abidjan").format("DD/MM/YYYY");

      const msg = `
━━━━━━━━━━━━━━━━━━━
🎯 𝐏𝐑𝐄𝐅𝐈𝐗 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍
━━━━━━━━━━━━━━━━━━━

🏷️ 𝖯𝗋𝖾́𝖿𝗂𝗑𝖾 𝖺𝖼𝗍𝗎𝖾𝗅 : 「 ${prefix} 」
📅 𝖬𝗂𝗌 𝖾𝗇 𝗌𝖾𝗋𝗏𝗂𝖼𝖾 : ${date}
💬 𝖢𝗈𝗆𝗆𝖺𝗇𝖽𝖾𝗌 𝗍𝗈𝗍𝖺𝗅𝖾𝗌 : ${totalCmd}

━━━━━━━━━━━━━━━━━━━
👤 𝐔𝐓𝐈𝐋𝐈𝐒𝐀𝐓𝐄𝐔𝐑 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍
━━━━━━━━━━━━━━━━━━━

📝 𝖭𝗈𝗆 : ${userName}
🆔 𝖴𝗌𝖾𝗋 𝖨𝖣 : ${senderID}
⚧️ 𝖦𝖾𝗇𝗋𝖾 : ${gender}
🔗 𝖯𝗋𝗈𝖿𝗂𝗅𝖾 : https://facebook.com/${senderID}

━━━━━━━━━━━━━━━━━━━
✨ 𝐏𝐨𝐮𝐫 𝐜𝐡𝐚𝐧𝐠𝐞𝐫 :
${prefix}prefix <nouveau_prefix>
━━━━━━━━━━━━━━━━━━━
      `.trim();

      api.sendMessage(msg, threadID, event.messageID);
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Erreur lors de la récupération des informations.", event.threadID, event.messageID);
    }
  }
};

// Activation du mode NOPREFIX
const w = new g.GoatWrapper(module.exports);
w.applyNoPrefix({ allowPrefix: false });
