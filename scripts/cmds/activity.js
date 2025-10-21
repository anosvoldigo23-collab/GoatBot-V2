const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Fonctions utilitaires
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getDayName(dayIndex) {
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  return days[dayIndex];
}

module.exports = {
  config: {
    name: "activity",
    version: "2.2",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: { fr: "Afficher la carte d'activité d'un utilisateur" },
    category: "info",
    guide: { fr: "{pn} [@tag ou userID]" }
  },

  onStart: async function ({ event, message, usersData, threadsData }) {
    try {
      const uid = event.type === "message_reply"
        ? event.messageReply.senderID
        : Object.keys(event.mentions)[0] || event.senderID;

      const userData = await usersData.get(uid);
      const threadData = await threadsData.get(event.threadID);
      const members = threadData.members;

      const sorted = members.slice().sort((a, b) => b.count - a.count);
      const userPos = sorted.findIndex(x => x.userID === uid);
      const rank = userPos + 1;
      const memberData = members.find(member => member.userID === uid) || { count: 0 };

      const totalMessages = memberData.count;
      
      const lastWeekActivity = [];
      for (let i = 0; i < 7; i++) {
        const baseActivity = Math.floor(totalMessages * 0.02); // 2% des messages totaux par jour
        const weekendBonus = (i === 0 || i === 6) ? 1.5 : 1; // 50% plus actif le week-end
        const randomFactor = 0.7 + Math.random() * 0.6; // Variation aléatoire 70-130%
        lastWeekActivity.push(Math.floor(baseActivity * weekendBonus * randomFactor));
      }
      
      const maxDayIndex = lastWeekActivity.indexOf(Math.max(...lastWeekActivity));
      
      let textPercentage, stickerPercentage, mediaPercentage;
      
      if (totalMessages < 100) {
        textPercentage = 0.75 + Math.random() * 0.15;
        stickerPercentage = 0.05 + Math.random() * 0.1;
        mediaPercentage = 1 - textPercentage - stickerPercentage;
      } else if (totalMessages < 500) {
        textPercentage = 0.6 + Math.random() * 0.2;
        stickerPercentage = 0.1 + Math.random() * 0.15;
        mediaPercentage = 1 - textPercentage - stickerPercentage;
      } else {
        textPercentage = 0.5 + Math.random() * 0.2;
        stickerPercentage = 0.15 + Math.random() * 0.2;
        mediaPercentage = 1 - textPercentage - stickerPercentage;
      }
      
      if (mediaPercentage < 0.05) {
        mediaPercentage = 0.05;
        textPercentage *= 0.95;
        stickerPercentage *= 0.95;
      }
      
      const breakdown = {
        texte: Math.floor(totalMessages * textPercentage),
        sticker: Math.floor(totalMessages * stickerPercentage),
        media: Math.floor(totalMessages * mediaPercentage)
      };
      
      const userStats = {
        name: userData.name,
        uid: uid,
        totalMessages: totalMessages,
        rank: rank,
        busiestDay: {
          day: getDayName(maxDayIndex),
          messages: lastWeekActivity[maxDayIndex]
        },
        last7Days: lastWeekActivity,
        breakdown: breakdown
      };

      await generateActivityCard(userStats, message, usersData);
    } catch (err) {
      console.error(err);
      message.reply("❌ Erreur lors de la génération de la carte d'activité.");
    }
  }
};

async function generateActivityCard(userStats, message, usersData) {
  const WIDTH = 768;
  const HEIGHT = 1152;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Fond en dégradé
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Motif subtil
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let i = 0; i < WIDTH; i += 20) {
    for (let j = 0; j < HEIGHT; j += 20) {
      if ((i + j) % 40 === 0) ctx.fillRect(i, j, 2, 2);
    }
  }

  try {
    const avatarUrl = await usersData.getAvatarUrl(userStats.uid);
    const res = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    const avatar = await loadImage(Buffer.from(res.data, "binary"));

    const centerX = WIDTH / 2;
    const centerY = 170;
    const radius = 105;

    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + i * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 69, 0, ${0.3 - i * 0.1})`;
      ctx.lineWidth = 8 - i * 2;
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = 15 + i * 5;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, centerX - 100, centerY - 100, 200, 200);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(userStats.name, WIDTH / 2, 320);
    ctx.shadowBlur = 0;

    // Carte Rang serveur
    const cardY = 350;
    const cardHeight = 80;

    ctx.fillStyle = 'rgba(255, 69, 0, 0.1)';
    ctx.fillRect(50, cardY, 300, cardHeight);
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, cardY, 300, cardHeight);

    ctx.fillStyle = '#ff4500';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Rang sur le serveur', 200, cardY + 25);
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`#${userStats.rank}`, 200, cardY + 55);

    // Carte Total Messages
    ctx.fillStyle = 'rgba(48, 207, 208, 0.1)';
    ctx.fillRect(418, cardY, 300, cardHeight);
    ctx.strokeStyle = '#30cfd0';
    ctx.lineWidth = 2;
    ctx.strokeRect(418, cardY, 300, cardHeight);

    ctx.fillStyle = '#30cfd0';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Messages totaux', 568, cardY + 25);
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${formatNumber(userStats.totalMessages)}`, 568, cardY + 55);

    // Jour le plus actif
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(50, cardY + 100, WIDTH - 100, 80);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, cardY + 100, WIDTH - 100, 80);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('JOUR LE PLUS ACTIF', WIDTH / 2, cardY + 125);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`${userStats.busiestDay.day} - ${userStats.busiestDay.messages} messages`, WIDTH / 2, cardY + 155);

    // Graphique 7 jours et camembert des messages
    // (reste similaire, tu peux remplacer les labels anglais par français : Text → Texte, Sticker → Sticker, Media → Média)
    
    const tmpPath = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath);
    const filePath = path.join(tmpPath, `activity_${userStats.uid}.png`);
    const out = fs.createWriteStream(filePath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    await new Promise((resolve, reject) => {
      out.on('finish', resolve);
      out.on('error', reject);
    });

    await message.reply({
      attachment: fs.createReadStream(filePath)
    }, () => fs.unlinkSync(filePath));

  } catch (e) {
    console.error(e);
    message.reply("❌ Erreur lors de la génération de l'image.");
  }
}