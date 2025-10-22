const moment = require("moment-timezone");

const LINE = "━━━━━━━━━━━━━━━━━━━";
const ARROW = "➤";
const COIN = "💰";
const BANK = "🏦";
const CLOCK = "⏰";
const TROPHY = "🏆";
const CROSS = "❌";
const CHECK = "✅";
const INFO = "💬";

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "money"],
    version: "3.1",
    author: "Christus | GPT-5",
    countDown: 8,
    role: 0,
    category: "Finance",
    shortDescription: "💰 Vérifie ton argent virtuel",
    longDescription: "Affiche ton solde, ton total, ton classement et plus encore.",
  },

  onStart: async function ({ event, api, usersData, args }) {
    try {
      const senderID = event.senderID;

      // Récupère ou initialise les données utilisateur
      let userData = await usersData.get(senderID);
      if (!userData) {
        userData = { money: 0, bank: 0, name: "Utilisateur inconnu" };
        await usersData.set(senderID, userData);
      }

      // S'assure que tout est bien défini
      userData.money = Number(userData.money) || 0;
      userData.bank = Number(userData.bank) || 0;
      userData.points = Number(userData.points) || 0;
      userData.cars = Number(userData.cars) || 0;
      userData.pets = Number(userData.pets) || 0;
      userData.garden = Number(userData.garden) || 0;

      // Met à jour le nom si manquant
      if (!userData.name || userData.name === "Utilisateur inconnu") {
        const info = await api.getUserInfo(senderID);
        userData.name = info[senderID]?.name || "Utilisateur inconnu";
        await usersData.set(senderID, userData);
      }

      const action = (args[0] || "").toLowerCase();

      // === 💰 BALANCE SIMPLE ===
      if (!action) {
        const total = userData.money + userData.bank;

        const allUsers = await usersData.getAll();
        const sorted = allUsers.sort(
          (a, b) => (b.money + (b.bank || 0)) - (a.money + (a.bank || 0))
        );
        const rank = sorted.findIndex(u => u.userID === senderID) + 1;

        const msg =
          `\n${LINE}\n${COIN} 𝗕𝗔𝗟𝗔𝗡𝗖𝗘 𝗗𝗘 ${userData.name}\n${LINE}\n` +
          `${ARROW} ${COIN} Portefeuille : ${userData.money.toLocaleString()}$\n` +
          `${ARROW} ${BANK} Banque : ${userData.bank.toLocaleString()}$\n` +
          `${ARROW} 💼 Total : ${total.toLocaleString()}$\n` +
          `${ARROW} ${TROPHY} Rang global : #${rank}\n` +
          `${LINE}\n${CLOCK} ${moment().tz("Africa/Abidjan").format("DD/MM/YYYY HH:mm:ss")}\n${LINE}`;

        return api.sendMessage(msg, event.threadID);
      }

      // === 🏦 BALANCE ALL ===
      if (["all", "-a"].includes(action)) {
        const total = userData.money + userData.bank;

        const msg =
          `\n${LINE}\n${BANK} 𝗗𝗘́𝗧𝗔𝗜𝗟𝗦 𝗗𝗘 ${userData.name}\n${LINE}\n` +
          `${ARROW} ${COIN} Argent en poche : ${userData.money.toLocaleString()}$\n` +
          `${ARROW} ${BANK} Banque : ${userData.bank.toLocaleString()}$\n` +
          `${ARROW} 💎 Total : ${total.toLocaleString()}$\n` +
          `${ARROW} 🪙 Points : ${userData.points.toLocaleString()}\n` +
          `${ARROW} 🚗 Voitures : ${userData.cars}\n` +
          `${ARROW} 🐈 Animaux : ${userData.pets}\n` +
          `${ARROW} 🌱 Jardin : ${userData.garden}\n` +
          `${LINE}`;

        return api.sendMessage(msg, event.threadID);
      }

      // === 🏆 TOP 10 ===
      if (["top", "-t"].includes(action)) {
        const all = await usersData.getAll();
        const sorted = all.sort(
          (a, b) => (b.money + (b.bank || 0)) - (a.money + (a.bank || 0))
        );
        const top = sorted.slice(0, 10);

        let msg = `\n${LINE}\n${TROPHY} 𝗧𝗢𝗣 𝟭𝟬 𝗗𝗘𝗦 𝗣𝗟𝗨𝗦 𝗥𝗜𝗖𝗛𝗘𝗦\n${LINE}\n`;
        let i = 1;
        for (const u of top) {
          const total = (u.money || 0) + (u.bank || 0);
          msg += `${i === 1 ? "👑" : `${i}.`} ${u.name || "Inconnu"} — 💰 ${total.toLocaleString()}$\n`;
          i++;
        }
        msg += `${LINE}\n${CLOCK} Mise à jour : ${moment().tz("Africa/Abidjan").format("HH:mm:ss")}`;

        return api.sendMessage(msg, event.threadID);
      }

      // === 🔧 FIX ===
      if (["fix", "-f"].includes(action)) {
        let corrupted = false;
        if (isNaN(userData.money) || userData.money < 0) {
          userData.money = 0;
          corrupted = true;
        }
        if (isNaN(userData.bank) || userData.bank < 0) {
          userData.bank = 0;
          corrupted = true;
        }

        await usersData.set(senderID, userData);
        return api.sendMessage(
          corrupted
            ? `${CHECK} Données réparées avec succès ✅`
            : `${INFO} Aucun problème détecté.`,
          event.threadID
        );
      }

      // === ♻️ RESET ===
      if (["reset", "-r"].includes(action)) {
        if (args[1] !== "confirm") {
          return api.sendMessage(
            `${INFO} Pour confirmer, tape : balance reset confirm`,
            event.threadID
          );
        }
        userData.money = 0;
        userData.bank = 0;
        await usersData.set(senderID, userData);
        return api.sendMessage(`${CHECK} Ton argent a été remis à zéro.`, event.threadID);
      }

      // === Option invalide ===
      return api.sendMessage(
        `${CROSS} Option invalide.\n${INFO} Utilise :\n• balance\n• balance all\n• balance top\n• balance fix\n• balance reset confirm`,
        event.threadID
      );
    } catch (err) {
      console.error(err);
      return api.sendMessage(`${CROSS} Erreur : ${err.message}`, event.threadID);
    }
  },
};
