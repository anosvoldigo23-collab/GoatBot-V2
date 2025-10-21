const fs = require("fs-extra");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "3.1",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: "🚀 𝗠𝗼𝗱𝗶𝗳𝗶𝗲 𝗹𝗲 𝗽𝗿𝗲́𝗳𝗶𝘅 𝗱𝘂 𝗯𝗼𝘁 𝗲𝗻 𝗺𝗮𝗷 𝗱𝗮𝗻𝘀 𝗹𝗲 𝗰𝗵𝗮𝘁 𝗼𝘂 𝗴𝗹𝗼𝗯𝗮𝗹𝗲𝗺𝗲𝗻𝘁",
    category: "🛠️ 𝗦𝘆𝘀𝘁𝗲̀𝗺𝗲",
    guide: {
      en:
`╔═══════════✨ 𝗣𝗥𝗘𝗙𝗜𝗫 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 ✨═══════════╗
║ 🔹 𝗨𝘁𝗶𝗹𝗶𝘀𝗮𝘁𝗶𝗼𝗻 :
║   {pn} <𝗻𝗼𝘂𝘃𝗲𝗮𝘂 𝗽𝗿𝗲́𝗳𝗶𝘅𝗲> → change le préfixe du chat
║   Exemple : {pn} $
║
║ 🌐 {pn} <𝗻𝗼𝘂𝘃𝗲𝗮𝘂 𝗽𝗿𝗲́𝗳𝗶𝘅𝗲> -g → change le préfixe global (Admin)
║   Exemple : {pn} ! -g
║
║ ♻️ {pn} reset → réinitialise le préfixe par défaut
║ 📌 {pn} → affiche les infos des préfixes
╚════════════════════════════════════════════╝`
    }
  },

  langs: {
    en: {
      reset: "✅ 𝗣𝗿𝗲́𝗳𝗶𝘅𝗲 𝗿𝗲́𝗶𝗻𝗶𝘁𝗶𝗮𝗹𝗶𝘀𝗲́ : %1",
      onlyAdmin: "⛔ Seuls les admins peuvent changer le préfixe global !",
      confirmGlobal: "⚡ Clique pour confirmer la mise à jour du préfixe global 🌐",
      confirmThisThread: "⚡ Clique pour confirmer la mise à jour du préfixe de ce chat 💬",
      successGlobal: "✅ Préfixe global mis à jour avec succès : %1",
      successThisThread: "✅ Préfixe du chat mis à jour avec succès : %1"
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    if (!args[0]) return message.SyntaxError();

    // 🔄 Réinitialisation du préfixe
    if (args[0].toLowerCase() === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    const newPrefix = args[0];
    const setGlobal = args.includes("-g");
    if (setGlobal && role < 2) return message.reply(getLang("onlyAdmin"));

    const confirmMessage = setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");
    const sentMessage = await message.reply(confirmMessage);

    global.GoatBot.onReaction.set(sentMessage.messageID, {
      author: event.senderID,
      newPrefix,
      setGlobal,
      messageID: sentMessage.messageID,
      commandName
    });
  },

  onReaction: async function ({ message, event, Reaction, threadsData, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    }

    await threadsData.set(event.threadID, newPrefix, "data.prefix");
    return message.reply(getLang("successThisThread", newPrefix));
  },

  onChat: async function ({ event, message, threadsData, usersData }) {
    const globalPrefix = global.GoatBot.config.prefix;
    const threadPrefix = await threadsData.get(event.threadID, "data.prefix") || globalPrefix;

    if (event.body && event.body.toLowerCase() === "prefix") {
      const userName = await usersData.getName(event.senderID);

      return message.reply(
`╔═💎══════════════════ 𝗜𝗡𝗙𝗢 𝗣𝗥𝗘𝗙𝗜𝗫𝗘 💎═╗
║ 👤 Utilisateur : ${userName}
║ 🌐 Préfixe Global : ${globalPrefix}
║ 💬 Préfixe du Chat : ${threadPrefix}
╚═══════════════════════════════════════╝
✨ 𝗖𝗛𝗥𝗜𝗦𝗧𝗨𝗦_𝗕𝗢𝗧 te souhaite de 💥 styliser 💥 tes messages !`
      );
    }
  }
};
