module.exports = {
  config: {
    name: "rank",
    aliases: ["ranking", "leaderboard"],
    version: "1.0",
    role: 0,
    author: "Christus",
    description: "Show user rankings based on XP and Money",
    category: "information",
    countDown: 5,
  },

  onStart: async function ({ event, message, usersData }) {
    try {
      const allUsers = (await usersData.getAll()) || [];
      if (allUsers.length === 0) return message.reply("❌ No users found.");

      // Sort by XP for leaderboard
      const xpRanked = allUsers
        .slice()
        .sort((a, b) => (b.exp || 0) - (a.exp || 0))
        .slice(0, 10); // top 10
      // Sort by Money for leaderboard
      const moneyRanked = allUsers
        .slice()
        .sort((a, b) => (b.money || 0) - (a.money || 0))
        .slice(0, 10);

      // Format leaderboard nicely
      let xpList = "🏆 𝐓𝐎𝐏 10 𝐔𝐒𝐄𝐑𝐒 𝐁𝐘 𝐄𝐗𝐏\n━━━━━━━━━━━━\n";
      xpRanked.forEach((u, idx) => {
        xpList += `#${idx + 1} ${u.name || "Unknown"} — ${u.exp || 0} XP\n`;
      });

      let moneyList = "💰 𝐓𝐎𝐏 10 𝐔𝐒𝐄𝐑𝐒 𝐁𝐘 𝐌𝐎𝐍𝐄𝐘\n━━━━━━━━━━━━\n";
      moneyRanked.forEach((u, idx) => {
        moneyList += `#${idx + 1} ${u.name || "Unknown"} — ${formatMoney(
          u.money || 0
        )}\n`;
      });

      // Get requesting user's ranks
      const uid = event.senderID;
      const userXpRank =
        allUsers
          .slice()
          .sort((a, b) => (b.exp || 0) - (a.exp || 0))
          .findIndex((u) => String(u.userID) === String(uid)) + 1 || "N/A";
      const userMoneyRank =
        allUsers
          .slice()
          .sort((a, b) => (b.money || 0) - (a.money || 0))
          .findIndex((u) => String(u.userID) === String(uid)) + 1 || "N/A";

      const userRecord = await usersData.get(uid);
      const userInfo = `
👤 𝐘𝐎𝐔𝐑 𝐑𝐀𝐍𝐊
━━━━━━━━━━━━
XP Rank: #${userXpRank} — ${userRecord?.exp || 0} XP
Money Rank: #${userMoneyRank} — ${formatMoney(userRecord?.money || 0)}
`;

      const body = [xpList, "\n", moneyList, "\n", userInfo].join("\n");

      return message.reply(body);
    } catch (err) {
      console.error("RANK command error:", err);
      return message.reply("❌ An error occurred while fetching the leaderboard.");
    }
  },
};

// --- helpers ---
function formatMoney(num) {
  num = Number(num) || 0;
  if (num === 0) return "$0";
  const units = ["", "K", "M", "B", "T"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return "$" + num.toFixed(1).replace(/\.0$/, "") + units[unit];
}
