const { GoatWrapper } = require("fca-liane-utils");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

/**
 * HELP ULTRA — Auteur: Christus
 * - Nom de la commande: help
 * - Format ultra stylisé, emojis aléatoires, police Unicode
 */

module.exports = {
  config: {
    name: "help",
    version: "3.3",
    author: "Christus",
    usePrefix: false,
    countDown: 2,
    role: 0,
    shortDescription: { en: "✨ Command index + details (stylish)" },
    longDescription: { en: "List all commands or show detailed usage in a flashy, unreadable-by-robots style." },
    category: "info",
    guide: { en: "{pn}help <command> — show command details" },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    try {
      const { threadID } = event;
      const prefix = getPrefix(threadID) || "";
      const EMOS = ["⚡","✨","🌌","🛸","🔮","🔥","💠","🪄","🌟","🧩"]; // pool d'emojis
      const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const fancy = (s) =>
        String(s)
          .replace(/[A-Za-z0-9]/g, (c) => c) // placeholder - keep content but allow future transform
          .replace(/\s{2,}/g, " ");

      // build categories map
      const cats = {};
      for (let [name, cmd] of commands) {
        // skip commands the user can't access
        if (cmd.config.role > 1 && role < cmd.config.role) continue;
        const category = (cmd.config.category || "Misc").toString();
        if (!cats[category]) cats[category] = [];
        cats[category].push(name);
      }

      // if no args => list all (grouped)
      if (!args || args.length === 0) {
        let header = `╔══════════════════════════════════╗\n`;
        header += `║ ${rnd(EMOS)}  𝓗𝓔𝓛𝓟 • 𝓑𝕐  ${module.exports.config.author}  ${rnd(EMOS)}\n`;
        header += `╠══════════════════════════════════╣\n`;
        header += `║ Prefix: ${prefix || "no-prefix"}  •  Total: ${commands.size}\n`;
        header += `╚══════════════════════════════════╝\n\n`;

        let body = "";
        // iterate categories with flashy sections
        Object.keys(cats)
          .sort((a, b) => a.localeCompare(b))
          .forEach((category) => {
            if (category.toLowerCase() === "info") return; // skip info if desired
            const list = cats[category].sort();
            const title = `╭─ ${rnd(EMOS)} ${category.toUpperCase()} ${rnd(EMOS)} ─╮\n`;
            body += title;
            // print commands in rows of 3 with decorative markers
            for (let i = 0; i < list.length; i += 3) {
              const slice = list.slice(i, i + 3).map((c) => `【${c}】`);
              body += `│ ${slice.join("   ")}\n`;
            }
            body += `╰─────────────────────────────╯\n\n`;
          });

        const footer = `Tip: ${prefix}help <command>  ・  Join: ${prefix}support  ・  ${rnd(EMOS)}`;
        await message.reply({ body: fancy(header + body + footer) });
        return;
      }

      // show details for a specific command
      const query = args[0].toLowerCase();
      const command = commands.get(query) || commands.get(aliases.get(query));
      if (!command) {
        return await message.reply(
          `❌  Command "${query}" introuvable. Essayez ${prefix}help pour la liste.`
        );
      }

      const cfg = command.config || {};
      const roleString = (() => {
        switch (cfg.role) {
          case 0:
            return "0 — Everyone";
          case 1:
            return "1 — Group Admins";
          case 2:
            return "2 — Bot Admins";
          default:
            return `${cfg.role} — Unknown`;
        }
      })();

      const aliasTxt = Array.isArray(cfg.aliases) && cfg.aliases.length ? cfg.aliases.join(", ") : "—";
      const desc = (cfg.longDescription && cfg.longDescription.en) || cfg.shortDescription?.en || "No description provided.";
      const usageTemplate = (cfg.guide?.en || "{pn}" + cfg.name).replace(/{pn}/g, prefix).replace(/{p}/g, prefix).replace(/{n}/g, cfg.name);

      // fancy detail card
      const card = [
        "╔════════════════════════════════════╗",
        `║  ${"✦".repeat(1)}  𝓒𝓸𝓶𝓶𝓪𝓷𝓭 • 𝓭𝓮𝓽𝓪𝓲𝓵  ${"✦".repeat(1)}`,
        "╠════════════════════════════════════╣",
        `║ • 𝓝𝓪𝓶𝓮: ${cfg.name}`,
        `║ • 𝓐𝓾𝓽𝓱𝓸𝓻: ${cfg.author || module.exports.config.author}`,
        `║ • 𝓥𝓮𝓻𝓼𝓲𝓸𝓷: ${cfg.version || "1.0"}`,
        `║ • 𝓡𝓸𝓵𝓮: ${roleString}`,
        `║ • 𝓒𝓸𝓸𝓵𝓭𝓸𝔀𝓷: ${cfg.countDown || 1}s`,
        `║ • 𝓐𝓵𝓲𝓪𝓼𝓮𝓼: ${aliasTxt}`,
        "╠════════════════════════════════════╣",
        `║ ✧ Description:\n║ ${desc}`,
        "╠════════════════════════════════════╣",
        `║ ✧ Usage:\n║ ${usageTemplate}`,
        "╚════════════════════════════════════╝",
      ].join("\n");

      return await message.reply({ body: fancy(card) });
    } catch (err) {
      // safe fallback
      await message.reply(`⚠️ Une erreur est survenue dans help: ${err.message || err}`);
      console.error("HELP CMD ERROR:", err);
    }
  },
};

// apply no-prefix but allow prefix if provided
new GoatWrapper(module.exports).applyNoPrefix({ allowPrefix: true });
