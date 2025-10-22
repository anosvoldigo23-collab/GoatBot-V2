const axios = require("axios");

module.exports = {
  config: {
    name: "bal",
    aliases: ["balance", "wallet", "fin"],
    version: "1.0",
    role: 0,
    author: "Christus",
    description: "Show financial profile / balance summary",
    category: "finance",
    countDown: 5,
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    try {
      // Determine target uid (mention, reply, id argument or self)
      const uid1 = event.senderID;
      const uid2 =
        event.mentions && Object.keys(event.mentions).length
          ? Object.keys(event.mentions)[0]
          : null;

      let uid = null;
      if (args && args[0]) {
        if (/^\d+$/.test(args[0])) uid = args[0];
        else {
          const m = args[0].match(/profile\.php\?id=(\d+)/);
          if (m) uid = m[1];
        }
      }
      if (!uid) {
        uid =
          event.type === "message_reply"
            ? event.messageReply?.senderID
            : uid2 || uid1;
      }

      // Fetch platform user info and local DB record
      const userInfoRaw = (await api.getUserInfo(uid)) || {};
      const userInfo = userInfoRaw[uid] || {};
      const record = (await usersData.get(uid)) || {};

      // Avatar fallback
      let avatar = null;
      try {
        avatar = (await usersData.getAvatarUrl(uid)) || null;
      } catch (e) {
        avatar = null;
      }
      if (!avatar) avatar = "https://i.imgur.com/TPHk4Qu.png";

      // Money, exp and user list for ranks
      const money = Number(record.money || 0);
      const exp = Number(record.exp || 0);
      const allUsers = (await usersData.getAll()) || [];

      const moneyRank =
        allUsers.length > 0
          ? allUsers
              .slice()
              .sort((a, b) => (b.money || 0) - (a.money || 0))
              .findIndex((u) => String(u.userID) === String(uid)) + 1
          : 0;
      const totalUsers = allUsers.length || 0;

      // Tier determination
      const tier = getTier(money);
      const tierEmoji = tierEmojiFor(tier);

      // Wealth score: log-based normalised to 0..999
      const wealthScore = calculateWealthScore(money);

      // Achievement level from wealthScore
      const achievement = getAchievementLevel(wealthScore);

      // Global position: use moneyRank as global position if available else "N/A"
      const globalPosition = moneyRank > 0 ? `#${moneyRank} of ${totalUsers}` : "Not ranked";

      // Format date/time Africa/Abidjan
      const now = new Date();
      const opts = {
        timeZone: "Africa/Abidjan",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      const reportDate = new Intl.DateTimeFormat("en-GB", opts).format(now);

      // Build message in template style
      const body = [
        "💰 𝐅𝐈𝐍𝐀𝐍𝐂𝐈𝐀𝐋 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 💰 👑",
        "━━━━━━━━━━━",
        "",
        "👤 𝐏𝐄𝐑𝐒𝐎𝐍𝐀𝐋 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 ━━━━━━━━━━━",
        `📝 𝖥𝗎𝗅𝗅 𝖭𝖺𝗆𝖾: ${userInfo.name || record.name || "Unknown"}`,
        `🆔 𝖴𝗌𝖾𝗋 𝖨𝖣: ${uid}`,
        `📅 𝖩𝗈𝗂𝗇𝖾𝖽: ${record.firstJoin || "Unknown"}`,
        `🎯 𝖠𝖼𝖼𝗈𝗎𝗇𝗍 𝖳𝗒𝗉𝖾: ${userInfo.type ? String(userInfo.type).toUpperCase() : "Your Account"}`,
        "",
        "💎 𝐖𝐄𝐀𝐋𝐓𝐇 𝐎𝐕𝐄𝐑𝐕𝐈𝐄𝐖 ━━━━━━━━━━━",
        `💰 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${formatMoney(money)}`,
        `🏆 𝐖𝐞𝐚𝐥𝐭𝐡 𝐑𝐚𝐧𝐤: ${moneyRank > 0 ? `${rankEmoji(moneyRank)} ${tierEmoji}` : tierEmoji}`,
        `📊 𝐆𝐥𝐨𝐛𝐚𝐥 𝐏𝐨𝐬𝐢𝐭𝐢𝐨𝐧: ${globalPosition}`,
        `⭐ 𝐓𝐢𝐞𝐫 𝐒𝐭𝐚𝐭𝐮𝐬: ${tier}`,
        "",
        "📈 𝐅𝐈𝐍𝐀𝐍𝐂𝐈𝐀𝐋 𝐌𝐄𝐓𝐑𝐈𝐂𝐒 ━━━━━━━━━━━",
        `💯 𝐖𝐞𝐚𝐥𝐭𝐡 𝐒𝐜𝐨𝐫𝐞: ${wealthScore}/999`,
        `🎖️ 𝐀𝐜𝐡𝐢𝐞𝐯𝐞𝐦𝐞𝐧𝐭 𝐋𝐞𝐯𝐞𝐥: ${achievement}`,
        `🔥 𝐒𝐭𝐚𝐭𝐮𝐬: ${statusTextFor(tier)}`,
        "",
        `🕐 Report Generated: ${reportDate}`,
      ].join("\n");

      await message.reply({
        body,
        attachment: await global.utils.getStreamFromURL(avatar),
      });
    } catch (err) {
      console.error("BAL command error:", err);
      return message.reply("❌ Une erreur est survenue lors de la récupération du profil financier.");
    }
  },
};

// --- helpers ---
function formatMoney(num) {
  num = Number(num) || 0;
  if (num === 0) return "$0";
  const neg = num < 0;
  num = Math.abs(num);
  const units = ["", "K", "M", "B", "T", "Q"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  let s = (Math.round(num * 10) / 10).toString().replace(/\.0$/, "");
  return (neg ? "-" : "") + "$" + s + units[unit];
}

function getTier(money) {
  if (money >= 1e12) return "Trillionaire";
  if (money >= 1e9) return "Billionaire";
  if (money >= 1e6) return "Millionaire";
  if (money >= 1e3) return "Wealthy";
  return "Common";
}

function tierEmojiFor(tier) {
  switch (tier) {
    case "Trillionaire":
      return "💎";
    case "Billionaire":
      return "👑";
    case "Millionaire":
      return "🏆";
    case "Wealthy":
      return "⭐";
    default:
      return "🔰";
  }
}

function calculateWealthScore(money) {
  // log10 based scale; yields 0..~999 (clamped)
  money = Number(money) || 0;
  if (money <= 0) return 0;
  const score = Math.round(Math.min(999, Math.log10(money + 1) * 120)); // tuned multiplier
  return score;
}

function getAchievementLevel(score) {
  if (score >= 900) return "Elite";
  if (score >= 700) return "Master";
  if (score >= 500) return "Pro";
  if (score >= 300) return "Experienced";
  return "Novice";
}

function statusTextFor(tier) {
  switch (tier) {
    case "Trillionaire":
      return "𝖳𝗋𝗂𝗅𝗅𝗂𝗈𝗇𝖺𝗂𝗋𝖾 — World class 🏦";
    case "Billionaire":
      return "𝖡𝗂𝗅𝗅𝗂𝗈𝗇𝖺𝗂𝗋𝖾 — Elite circle 💼";
    case "Millionaire":
      return "𝖬𝗂𝗅𝗅𝗂𝗈𝗇𝖺𝗂𝗋𝖾 — Millionaire Club 🏆";
    case "Wealthy":
      return "Well off — Keep growing 📈";
    default:
      return "Rising — Grind on 💪";
  }
}

function rankEmoji(rank) {
  if (!rank || rank <= 0) return "";
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
         }
