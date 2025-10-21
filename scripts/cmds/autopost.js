module.exports.config = {
  name: "autopost",
  version: "2.1.0",
  description: "Autopost tracker de jardin avec scores multiples, noms, outils, graines, œufs, cosmétiques, miel, météo, gains de points et activation/désactivation",
  usage: "autopost on/off/score",
  role: 0,
  author: 'Christus x Aesther'
};

let autoPostInterval = null;
let activeUsers = new Set(); // Ensemble des utilisateurs actifs
let userScores = {}; // Stockage en mémoire des scores des utilisateurs
let userNames = {}; // Cache pour les noms d'utilisateurs

module.exports.onStart = async function({ api, event, usersData }) {
  const args = event.body.slice(9).trim().split(' ');
  const action = args[0];
  const replyToId = event.messageID;
  const userId = event.senderID;

  if (action === 'on') {
    if (activeUsers.has(userId)) {
      api.sendMessage("Vous êtes déjà dans l'autopost !", event.threadID, replyToId);
      return;
    }
    // Récupérer le nom de l'utilisateur
    if (!userNames[userId]) {
      try {
        const userInfo = await api.getUserInfo(userId);
        userNames[userId] = userInfo[userId].name;
      } catch (error) {
        userNames[userId] = 'Inconnu';
      }
    }
    activeUsers.add(userId);
    if (!userScores[userId]) userScores[userId] = 0;

    if (!autoPostInterval) {
      // Démarrer l'intervalle si non déjà actif
      autoPostInterval = setInterval(async () => {
        // Équipements
        const gear = [
          '- Billet d\'échange : x1',
          '- 🧴 Spray de nettoyage : x1',
          '- 🛠 Truelle : x3',
          '- 🔧 Clé de rappel : x3',
          '- 🚿 Arrosoir : x3',
          '- ❤ Outil préféré : x2',
          '- 💧 Arroseur de base : x3',
          '- 🌾 Outil de récolte : x1',
          '- 🎫 Billet 2 : x1'
        ];

        // Graines de base
        const baseSeeds = [
          '- 🥕 Carotte : x14',
          '- 🍇 Raisin : x1',
          '- 🍓 Fraise : x5',
          '- 🌷 Tulipe orange : x24',
          '- 🍅 Tomate : x3',
          '- 🫐 Myrtille : x5',
          '- 🍎 Pomme : x10',
          '- 🍌 Banane : x20',
          '- 🌽 Maïs : x8',
          '- 🍎 Pomme rouge : x15'
        ];

        // Mélanger les graines pour le hasard
        const shuffledSeeds = baseSeeds.sort(() => 0.5 - Math.random());
        const selectedSeeds = shuffledSeeds.slice(0, 6);

        // Œufs
        const eggs = [
          '- 🥚 Œuf commun : x1',
          '- 🥚 Œuf commun : x1',
          '- 🥚 Œuf commun : x1'
        ];

        // Cosmétiques
        const cosmetics = [
          '- Caisse de plage : x2',
          '- Cabana : x1',
          '- Bac à compost : x1',
          '- Torche : x1',
          '- Table en pierre longue : x1',
          '- Tas de pierres : x1',
          '- Petite tuile circulaire : x5',
          '- Grande table en bois : x1',
          '- Bibliothèque : x1'
        ];

        // Miel
        const honey = [
          '- Radar corrompu : x1',
          '- Pack de graines Zen : x1',
          '- Buisson Sakura : x1',
          '- Zenflare : x2',
          '- Radar Tranquille : x2',
          '- Rayon de miel : x5',
          '- Ruche : x3',
          '- Gelée royale : x2'
        ];

        // Météo
        const weather = '⚡ Orage\n📋 Orage - Fin : 14:42 - Durée : 3 minutes\n+50% vitesse de croissance ! Plus de chances de fruits électrisés !\n🎯 +50% croissance ; même chance de pluie';

        const gearMessage = gear.join('\n');
        const seedsMessage = selectedSeeds.join('\n');
        const eggsMessage = eggs.join('\n');
        const cosmeticsMessage = cosmetics.join('\n');
        const honeyMessage = honey.join('\n');

        // Liste des utilisateurs actifs
        const activeUsersList = Array.from(activeUsers).map(id => {
          const name = userNames[id] || 'Inconnu';
          const score = userScores[id] || 0;
          return `👤 ${name} : 🏆 ${score}`;
        }).join('\n');

        const fullMessage = `𝗝𝗮𝗿𝗱𝗶𝗻 — 𝗧𝗿𝗮𝗰𝗸𝗲𝗿\n\n🛠 𝗢𝘂𝘁𝗶𝗹𝘀 :\n${gearMessage}\n⏳ Reapprovisionnement dans : 00h 04m 55s\n\n🌱 𝗚𝗿𝗮𝗶𝗻𝗲𝘀 :\n${seedsMessage}\n⏳ Reapprovisionnement dans : 00h 04m 55s\n\n🥚 𝗢𝗲𝘂𝗳𝘀 :\n${eggsMessage}\n⏳ Reapprovisionnement dans : 00h 19m 55s\n\n🎨 𝗖𝗼𝘀𝗺𝗲́𝘁𝗶𝗾𝘂𝗲𝘀 :\n${cosmeticsMessage}\n⏳ Reapprovisionnement dans : 06h 19m 55s\n\n🍯 𝗠𝗶𝗲𝗹 :\n${honeyMessage}\n⏳ Reapprovisionnement dans : 00h 19m 55s\n\n🌤 𝗠𝗲́𝘁𝗲́𝗼 :\n${weather}\n\n🏅 𝗨𝘁𝗶𝗹𝗶𝘀𝗮𝘁𝗲𝘂𝗿𝘀 𝗮𝗰𝘁𝗶𝗳𝘀 :\n${activeUsersList}\n\n📅 Mis à jour (PH) : ${new Date().toLocaleString('fr-FR')}\n\n🌟 Super suivi de jardin ! 🌟`;

        try {
          api.createPost(fullMessage);
          // Augmenter le score et l'argent pour tous les utilisateurs actifs
          for (const id of activeUsers) {
            if (!userScores[id]) userScores[id] = 0;
            userScores[id] += 86000;
            const userData = await usersData.get(id) || { money: 0 };
            const newMoney = (userData.money || 0) + 86000;
            await usersData.set(id, { ...userData, money: newMoney });
          }
        } catch (error) {
          // Optionnel : log de l'erreur
        }
      }, 120000); // toutes les 2 minutes
    }
    api.sendMessage("Autopost activé ! Vous êtes maintenant actif et gagnerez 86K points et argent par publication. Publication toutes les 2 minutes.", event.threadID, replyToId);
  } else if (action === 'off') {
    if (activeUsers.has(userId)) {
      activeUsers.delete(userId);
      if (activeUsers.size === 0) {
        clearInterval(autoPostInterval);
        autoPostInterval = null;
      }
      api.sendMessage("Autopost désactivé pour vous !", event.threadID, replyToId);
    } else {
      api.sendMessage("Vous n'êtes pas dans l'autopost !", event.threadID, replyToId);
    }
  } else if (action === 'score') {
    const score = userScores[userId] || 0;
    api.sendMessage(`Votre score : ${score}`, event.threadID, replyToId);
  } else {
    api.sendMessage("Utilisation : autopost on/off/score", event.threadID, replyToId);
  }
};