/**
 * Bank command for GoatBot
 * Commands:
 *  - bank                         -> menu / solde rapide
 *  - bank bal | bank balance      -> afficher solde détaillé
 *  - bank deposit <amount|all>    -> déposer dans la "banque" (si tu as wallet/external money model adapt)
 *  - bank withdraw <amount|all>   -> retirer
 *  - bank transfer <@id|id> <amt> -> transférer à un autre utilisateur
 *  - bank interest                -> réclamer intérêts (1% par jour depuis lastInterest)
 *  - bank rich [n]                -> top n riches (par défaut 10)
 *
 * Adaptations possibles : noms de champs dans usersData (money, bank, exp, etc.)
 */

module.exports = {
  config: {
    name: "bank",
    aliases: ["balance", "wallet", "banque", "bal"],
    version: "1.0",
    role: 0,
    author: "Christus",
    description: "Gestion de compte : solde, dépôt, retrait, transfert, intérêts, classement",
    category: "finance",
    countDown: 5,
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    try {
      // Helpers
      const uidCaller = event.senderID;

      // load user record (create default if needed)
      async function getRecord(uid) {
        const rec = (await usersData.get(uid)) || {};
        // ensure fields
        rec.money = Number(rec.money || 0);
        rec.bank = Number(rec.bank || 0); // amount stored in bank
        rec.exp = Number(rec.exp || 0);
        rec.lastInterest = rec.lastInterest || null; // timestamp ms
        rec.firstJoin = rec.firstJoin || null;
        return rec;
      }
      async function saveRecord(uid, rec) {
        await usersData.set(uid, rec);
        return rec;
      }

      function parseAmount(str, fallbackAllAmount = 0) {
        if (!str) return null;
        if (str.toLowerCase() === "all") return "all";
        // allow commas and spaces
        const cleaned = String(str).replace(/[,\s$]/g, "");
        if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
        const n = Math.floor(Number(cleaned));
        return isNaN(n) ? null : n;
      }

      function formatMoney(n) {
        n = Number(n) || 0;
        if (n === 0) return "$0";
        const neg = n < 0;
        n = Math.abs(n);
        const units = ["", "K", "M", "B", "T"];
        let u = 0;
        while (n >= 1000 && u < units.length - 1) {
          n /= 1000;
          u++;
        }
        const s = (Math.round(n * 10) / 10).toString().replace(/\.0$/, "");
        return (neg ? "-" : "") + "$" + s + units[u];
      }

      function daysBetween(tsPast, tsNow) {
        if (!tsPast) return 0;
        const ms = Math.max(0, tsNow - tsPast);
        return Math.floor(ms / (1000 * 60 * 60 * 24));
      }

      // Parse subcommand
      const sub = args && args[0] ? args[0].toLowerCase() : "menu";

      // MENU / résumé par défaut
      if (["menu", "help", "info"].includes(sub)) {
        const rec = await getRecord(uidCaller);
        const body = [
          "🏦 𝐁𝐀𝐍𝐊 — Menu",
          "━━━━━━━━━━━━━━━━━━━━",
          `• Solde en main: ${formatMoney(rec.money)}`,
          `• Solde en banque: ${formatMoney(rec.bank)}`,
          `• Intérêts disponibles: ${formatMoney(calculateClaimableInterest(rec))}`,
          "",
          "Usage:",
          "• bank bal / balance -> Voir le solde complet",
          "• bank deposit <amount|all> -> Déposer",
          "• bank withdraw <amount|all> -> Retirer",
          "• bank transfer <@id|id> <amount> -> Transférer à un ami",
          "• bank interest -> Réclamer intérêts (1% par jour)",
          "• bank rich [n] -> Top n des plus riches",
        ].join("\n");
        return message.reply(body);
      }

      // BALANCE détaillé
      if (["bal", "balance"].includes(sub)) {
        const rec = await getRecord(uidCaller);

        // rank by money (bank + money)
        const all = (await usersData.getAll()) || [];
        const totals = all.map((u) => ({
          id: String(u.userID),
          total: Number((u.money || 0) + (u.bank || 0)),
          name: u.name || "Unknown",
        }));
        totals.sort((a, b) => b.total - a.total);
        const rank = totals.findIndex((t) => t.id === String(uidCaller)) + 1 || "N/A";

        const body = [
          "💳 𝐁𝐀𝐍𝐊 — Solde",
          "━━━━━━━━━━━━━━━━━━━━",
          `• Utilisateur: ${rec.name || "Toi"}`,
          `• En poche: ${formatMoney(rec.money)}`,
          `• En banque: ${formatMoney(rec.bank)}`,
          `• Total: ${formatMoney(rec.money + rec.bank)}`,
          `• Rang global: ${rank === "N/A" ? "Non classé" : `#${rank} / ${totals.length}`}`,
          `• Intérêts cumulés non réclamés: ${formatMoney(calculateClaimableInterest(rec))}`,
        ].join("\n");
        return message.reply(body);
      }

      // DEPOSIT
      if (["deposit", "dep", "d"].includes(sub)) {
        const amountArg = args[1];
        const amtParsed = parseAmount(amountArg);
        const rec = await getRecord(uidCaller);

        if (amtParsed === null) {
          return message.reply("❌ Montant invalide. Exemple: `bank deposit 500` ou `bank deposit all`");
        }

        let depositAmount;
        if (amtParsed === "all") {
          depositAmount = Math.floor(rec.money);
          if (depositAmount <= 0) return message.reply("❌ Tu n'as rien à déposer.");
        } else {
          depositAmount = Math.max(0, Math.floor(amtParsed));
          if (depositAmount <= 0) return message.reply("❌ Montant doit être > 0.");
          if (depositAmount > rec.money) return message.reply("❌ Fonds insuffisants.");
        }

        rec.money -= depositAmount;
        rec.bank += depositAmount;
        await saveRecord(uidCaller, rec);

        return message.reply(
          `✅ Déposé ${formatMoney(depositAmount)} en banque.\nNouveau solde banque: ${formatMoney(rec.bank)} — En poche: ${formatMoney(rec.money)}`
        );
      }

      // WITHDRAW
      if (["withdraw", "wd", "w"].includes(sub)) {
        const amountArg = args[1];
        const amtParsed = parseAmount(amountArg);
        const rec = await getRecord(uidCaller);

        if (amtParsed === null) {
          return message.reply("❌ Montant invalide. Exemple: `bank withdraw 300` ou `bank withdraw all`");
        }

        let withdrawAmount;
        if (amtParsed === "all") {
          withdrawAmount = Math.floor(rec.bank);
          if (withdrawAmount <= 0) return message.reply("❌ Tu n'as rien à retirer.");
        } else {
          withdrawAmount = Math.max(0, Math.floor(amtParsed));
          if (withdrawAmount <= 0) return message.reply("❌ Montant doit être > 0.");
          if (withdrawAmount > rec.bank) return message.reply("❌ Fonds en banque insuffisants.");
        }

        rec.bank -= withdrawAmount;
        rec.money += withdrawAmount;
        await saveRecord(uidCaller, rec);

        return message.reply(
          `✅ Retiré ${formatMoney(withdrawAmount)}.\nNouveau solde banque: ${formatMoney(rec.bank)} — En poche: ${formatMoney(rec.money)}`
        );
      }

      // TRANSFER
      if (["transfer", "trans", "t"].includes(sub)) {
        // args: target amount
        const targetArg = args[1];
        const amountArg = args[2];

        if (!targetArg || !amountArg) {
          return message.reply("❌ Syntaxe: `bank transfer <@id|id> <amount>`");
        }

        // get target id from mention or direct id
        let targetId = null;
        if (event.mentions && Object.keys(event.mentions).length) {
          targetId = Object.keys(event.mentions)[0];
        } else if (/^\d+$/.test(targetArg)) {
          targetId = targetArg;
        } else {
          const m = targetArg.match(/profile\.php\?id=(\d+)/);
          if (m) targetId = m[1];
        }
        if (!targetId) return message.reply("❌ Destinataire introuvable.");

        if (String(targetId) === String(uidCaller)) return message.reply("❌ Tu ne peux pas te transférer toi-même.");

        const amtParsed = parseAmount(amountArg);
        if (amtParsed === null || amtParsed === "all") {
          return message.reply("❌ Montant invalide. Exemple: `bank transfer 123456789 500`");
        }
        const amount = Math.max(1, Math.floor(amtParsed));

        const recFrom = await getRecord(uidCaller);
        if (recFrom.money < amount) return message.reply("❌ Fonds insuffisants pour le transfert (en poche).");

        const recTo = await getRecord(targetId);

        recFrom.money -= amount;
        recTo.money += amount;

        await saveRecord(uidCaller, recFrom);
        await saveRecord(targetId, recTo);

        // try to fetch display names
        let nameFrom = recFrom.name || "Toi";
        let nameTo = recTo.name || "Utilisateur";

        return message.reply(`✅ Transfert réussi: ${formatMoney(amount)} de ${nameFrom} → ${nameTo}`);
      }

      // INTEREST
      if (["interest", "int", "i"].includes(sub)) {
        const rec = await getRecord(uidCaller);
        const now = Date.now();
        const last = rec.lastInterest ? Number(rec.lastInterest) : null;
        const days = daysBetween(last, now);
        if (days <= 0) {
          return message.reply("ℹ️ Aucun intérêt disponible pour le moment. Les intérêts se calculent par jour (1% / jour).");
        }

        // interest rate: 1% per day on bank balance
        const dailyRate = 0.01;
        // cap days to 365 to avoid unrealistic leaps (safety)
        const effectiveDays = Math.min(days, 365);
        const interest = Math.floor(rec.bank * (Math.pow(1 + dailyRate, effectiveDays) - 1));

        if (interest <= 0) {
          // still update lastInterest so user can't spam
          rec.lastInterest = now;
          await saveRecord(uidCaller, rec);
          return message.reply("ℹ️ Intérêt calculé mais montant est $0. Essaie plus tard.");
        }

        rec.bank += interest;
        rec.lastInterest = now;
        await saveRecord(uidCaller, rec);

        return message.reply(
          `💸 Intérêts réclamés: ${formatMoney(interest)} (${effectiveDays} jours).\nNouveau solde banque: ${formatMoney(rec.bank)}`
        );
      }

      // RICH / TOP
      if (["rich", "richest", "top"].includes(sub)) {
        const n = args[1] && /^\d+$/.test(args[1]) ? Math.min(50, Number(args[1])) : 10;
        const all = (await usersData.getAll()) || [];
        if (all.length === 0) return message.reply("❌ Aucun utilisateur trouvé.");

        const ranked = all
          .map((u) => ({
            id: String(u.userID),
            name: u.name || "Unknown",
            money: Number(u.money || 0),
            bank: Number(u.bank || 0),
            total: Number((u.money || 0) + (u.bank || 0)),
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, n);

        let out = [`🏅 Top ${n} — Les plus riches`, "━━━━━━━━━━━━━━━━━━━━"];
        ranked.forEach((r, i) => {
          out.push(`${i + 1}. ${r.name} — Total: ${formatMoney(r.total)} (cash ${formatMoney(r.money)} / bank ${formatMoney(r.bank)})`);
        });
        return message.reply(out.join("\n"));
      }

      // Unknown subcommand
      return message.reply("❌ Sous-commande inconnue. Utilise `bank` pour voir le menu.");
    } catch (err) {
      console.error("BANK command error:", err);
      return message.reply("❌ Une erreur est survenue dans la commande bank.");
    }

    // helper local: claimable interest preview (not claiming)
    function calculateClaimableInterest(record) {
      if (!record) return 0;
      const last = record.lastInterest ? Number(record.lastInterest) : null;
      const days = daysBetween(last, Date.now());
      if (days <= 0) return 0;
      const dailyRate = 0.01;
      const effectiveDays = Math.min(days, 365);
      const interest = Math.floor(record.bank * (Math.pow(1 + dailyRate, effectiveDays) - 1));
      return interest;
    }
  },
};
