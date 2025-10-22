const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "4.1",
    author: "Christus",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Stylish help menu with frames" },
    category: "info",
    guide: { en: "{pn}help <command> — show command details" },
  },

  onStart: async function ({ message, args, event, usersData, role }) {
    try {
      const uid = event.senderID;
      const prefix = getPrefix(event.threadID) || "";
      const EMO = ["⚡","✨","🌌","🛸","🔮","🔥","💠","🪄","🌟","🧩"];
      const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

      // --- User profile ---
      const record = (await usersData.get(uid)) || {};
      let userInfo = {};
      try {
        const infoRaw = await (global.GoatBot.api?.getUserInfo ? global.GoatBot.api.getUserInfo(uid) : {});
        userInfo = infoRaw?.[uid] || {};
      } catch {}
      let avatar = null;
      try { avatar = await usersData.getAvatarUrl(uid); } catch {}
      if (!avatar) avatar = "https://i.imgur.com/TPHk4Qu.png";

      // --- No argument: list all commands ---
      if (!args || args.length === 0) {
        let header = `╭━━━━━━ ${rnd(EMO)} 𝐇𝐄𝐋𝐏 𝐌𝐄𝐍𝐔 ${rnd(EMO)} ━━━━━╮\n`;
        header += `┃ Prefix: ${prefix}   •   Total: ${commands.size}\n`;
        header += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        const cats = {};
        for (let [name, cmd] of commands) {
          if (cmd.config.role > 1 && role < cmd.config.role) continue;
          const category = (cmd.config.category || "Misc").toString();
          if (!cats[category]) cats[category] = [];
          cats[category].push(name);
        }

        let body = "";
        for (const category of Object.keys(cats).sort()) {
          const list = cats[category].sort();
          body += `╭─◯✦ ${category.toUpperCase()} ✦◯─╮\n`;
          body += list.length ? list.map(c => `  • ${prefix}${c}`).join("\n") : "  No commands found";
          body += `\n╰─────────────────╯\n\n`;
        }

        const footer = `💡 Type ${prefix}help <command> for more info!\n`;
        const profile = [
          "╭━━━━━━ 👤 𝐘𝐎𝐔𝐑 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 👤 ━━━━━╮",
          `┃ 📝 Name: ${userInfo.name || record.name || "Unknown"}`,
          `┃ 🆔 UID: ${uid}`,
          `┃ 💰 Balance: ${record.money || 0}$`,
          `┃ ⭐ Level: ${record.level || 0}`,
          `┃ 📈 EXP: ${record.exp || 0}`,
          "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯"
        ].join("\n");

        return await message.reply({ body: header + body + footer + "\n" + profile, attachment: await global.utils.getStreamFromURL(avatar) });
      }

      // --- Command details ---
      const query = args[0].toLowerCase();
      const command = commands.get(query) || commands.get(aliases.get(query));
      if (!command) return message.reply(`❌ Command "${query}" introuvable. Essayez ${prefix}help.`);

      const cfg = command.config || {};
      const roleString = {0:"Everyone",1:"Group Admins",2:"Bot Admins"}[cfg.role] || "Unknown";
      const aliasTxt = Array.isArray(cfg.aliases) && cfg.aliases.length ? cfg.aliases.join(", ") : "—";
      const desc = cfg.longDescription?.en || cfg.shortDescription?.en || "No description provided.";
      const usageTemplate = (cfg.guide?.en || "{pn}" + cfg.name).replace(/{pn}/g, prefix);

      const card = [
        "╭━━━━━━ 🪄 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐃𝐄𝐓𝐀𝐈𝐋 🪄 ━━━━━╮",
        `┃ Name: ${prefix}${cfg.name}`,
        `┃ Author: ${cfg.author || module.exports.config.author}`,
        `┃ Version: ${cfg.version || "1.0"}`,
        `┃ Role: ${roleString}`,
        `┃ Cooldown: ${cfg.countDown || 1}s`,
        `┃ Aliases: ${aliasTxt}`,
        `┃ Description: ${desc}`,
        `┃ Usage: ${usageTemplate}`,
        "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯"
      ].join("\n");

      const profile = [
        "╭━━━━━━ 👤 𝐘𝐎𝐔𝐑 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 👤 ━━━━━╮",
        `┃ 📝 Name: ${userInfo.name || record.name || "Unknown"}`,
        `┃ 🆔 UID: ${uid}`,
        `┃ 💰 Balance: ${record.money || 0}$`,
        `┃ ⭐ Level: ${record.level || 0}`,
        `┃ 📈 EXP: ${record.exp || 0}`,
        "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯"
      ].join("\n");

      await message.reply({ body: card + "\n\n" + profile, attachment: await global.utils.getStreamFromURL(avatar) });

    } catch (err) {
      console.error("HELP CMD ERROR:", err);
      await message.reply(`⚠️ Une erreur est survenue: ${err.message || err}`);
    }
  },
};
