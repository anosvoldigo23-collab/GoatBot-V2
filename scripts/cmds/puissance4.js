module.exports = {
  config: {
    name: "puissance4",
    aliases: ["4enligne", "p4"],
    version: "2.2",
    author: "Christus",
    countDown: 30,
    role: 0,
    category: "🎯 𝗝𝗘𝗨𝗫 & 𝗗𝗜𝗩𝗘𝗥𝗦𝗜𝗦𝗦𝗘𝗠𝗘𝗡𝗧",
    shortDescription: {
      fr: "🟡🔴 Puissance 4 avec modes Joueur vs IA / Joueur vs Joueur"
    },
    longDescription: {
      fr: "Jeu classique de connexion à 4 avec plateau visuel et IA intelligente"
    },
    guide: {
      fr: "Mode IA : puissance4 [mise]\nMode PvP : puissance4 [mise] @joueur"
    }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const miseMin = 100;
    const mise = parseInt(args[0]);
    const mentionnés = Object.keys(event.mentions);

    // Vérification de la mise
    if (!mise || isNaN(mise)) {
      return message.reply(`🌀 𝗠𝗶𝘀𝗲 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲\n━━━━━━━━━━━━\n❌ Veuillez indiquer un montant à miser\n💸 Mise minimale : ${miseMin} pièces\n\n🔹 Utilisation : puissance4 [mise] @joueur`);
    }
    if (mise < miseMin) {
      return message.reply(`⚠️ 𝗠𝗶𝘀𝗲 𝗺𝗶𝗻𝗶𝗺𝗮𝗹𝗲\n━━━━━━━━━━━━\n💰 Vous devez miser au moins ${miseMin} pièces !`);
    }

    const joueur1 = event.senderID;
    let typeDeJeu, joueur2;

    if (mentionnés.length === 0) {
      // Mode IA
      typeDeJeu = "pve";
      joueur2 = "bot";
    } else if (mentionnés.length === 1) {
      // Mode PvP
      typeDeJeu = "pvp";
      joueur2 = mentionnés[0];

      if (joueur1 === joueur2) {
        return message.reply("❌ 𝗔𝗱𝘃𝗲𝗿𝘀𝗮𝗶𝗿𝗲 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲\n━━━━━━━━━━━━\nVous ne pouvez pas jouer contre vous-même !");
      }
    } else {
      return message.reply("⚠️ 𝗘𝗻𝘁𝗿𝗲́𝗲 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲\n━━━━━━━━━━━━\n🔹 IA : puissance4 [mise]\n🔹 PvP : puissance4 [mise] @joueur");
    }

    // Vérification des fonds
    const [dataJ1, dataJ2] = await Promise.all([
      usersData.get(joueur1),
      typeDeJeu === "pvp" ? usersData.get(joueur2) : Promise.resolve({ money: Infinity })
    ]);

    if (dataJ1.money < mise) {
      return message.reply(`💸 𝗙𝗼𝗻𝗱𝘀 𝗶𝗻𝘀𝘂𝗳𝗳𝗶𝘀𝗮𝗻𝘁𝘀\n━━━━━━━━━━━━\n❌ Vous avez seulement ${dataJ1.money} pièces\n💰 Requis : ${mise} pièces`);
    }
    if (typeDeJeu === "pvp" && dataJ2.money < mise) {
      return message.reply(`💸 𝗙𝗼𝗻𝗱𝘀 𝗱𝗲 𝗹'𝗮𝗱𝘃𝗲𝗿𝘀𝗮𝗶𝗿𝗲\n━━━━━━━━━━━━\n❌ L'adversaire doit avoir ${mise} pièces pour jouer`);
    }

    // Déduction de la mise
    await usersData.set(joueur1, { money: dataJ1.money - mise });
    if (typeDeJeu === "pvp") {
      await usersData.set(joueur2, { money: dataJ2.money - mise });
    }

    // Initialisation du jeu
    const plateau = Array(6).fill().map(() => Array(6).fill(0)); // Grille 6x6
    const etatJeu = {
      joueurs: [joueur1, joueur2],
      joueurActuel: 0,
      plateau,
      mise,
      typeDeJeu,
      messageID: null
    };

    const texteAffichage = typeDeJeu === "pve"
      ? `🤖 𝗝𝗼𝘂𝗲𝘂𝗿 𝘃𝘀 𝗕𝗼𝘁\n💰 Mise : ${mise} pièces`
      : `👥 𝗝𝗼𝘂𝗲𝘂𝗿 𝘃𝘀 𝗝𝗼𝘂𝗲𝘂𝗿\n💰 Pot : ${mise * 2} pièces`;

    const msg = await message.reply(
      `🎮 𝗣𝗨𝗜𝗦𝗦𝗔𝗡𝗖𝗘 𝟰 🎮\n━━━━━━━━━━━━\n${texteAffichage}\n\n${this.getBoardDisplay(plateau)}\n\n` +
      `🔹 Tour actuel : ${await this.getPlayerName(api, joueur1)}\n` +
      "💬 Répondez avec une colonne (1-6) pour jouer !"
    );

    etatJeu.messageID = msg.messageID;
    global.connect4Games = global.connect4Games || {};
    global.connect4Games[msg.messageID] = etatJeu;
  },

  onChat: async function ({ api, event, message, usersData }) {
    if (!global.connect4Games) return;

    const gameEntry = Object.entries(global.connect4Games).find(([_, game]) =>
      game.joueurs[game.joueurActuel] === event.senderID &&
      /^[1-6]$/.test(event.body)
    );

    if (!gameEntry) return;

    const [messageID, game] = gameEntry;
    const colonne = parseInt(event.body) - 1;

    // Coup du joueur
    const ligne = this.makeMove(game.plateau, colonne, game.joueurActuel + 1);
    if (ligne === -1) {
      return message.reply("⚠️ 𝗖𝗼𝘂𝗽 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲\n━━━━━━━━━━━━\n❌ Colonne pleine !\n🔹 Choisissez une autre colonne (1-6)");
    }

    // Vérification victoire
    if (this.checkWin(game.plateau, ligne, colonne)) {
      const gagnant = game.joueurs[game.joueurActuel];
      const gains = game.mise * (game.typeDeJeu === "pvp" ? 2 : 1.5);

      await usersData.set(gagnant, {
        money: (await usersData.get(gagnant)).money + gains
      });

      const texteRésultat = gagnant === "bot"
        ? "🤖 𝗟𝗲 𝗯𝗼𝘁 𝗮 𝗴𝗮𝗴𝗻𝗲́ !\n━━━━━━━━━━━━\n❌ Rejouez pour prendre votre revanche !"
        : `🎉 𝗩𝗶𝗰𝘁𝗼𝗶𝗿𝗲 !\n━━━━━━━━━━━━\n💰 ${await this.getPlayerName(api, gagnant)} remporte ${gains} pièces !`;

      message.reply(
        `🎯 𝗙𝗜𝗡 𝗗𝗨 𝗝𝗘𝗨 🎯\n━━━━━━━━━━━━\n${texteRésultat}\n\n${this.getBoardDisplay(game.plateau)}`
      );
      delete global.connect4Games[messageID];
      return;
    }

    // Match nul
    if (this.isBoardFull(game.plateau)) {
      const remboursement = game.mise;
      await usersData.set(game.joueurs[0], {
        money: (await usersData.get(game.joueurs[0])).money + remboursement
      });
      if (game.typeDeJeu === "pvp") {
        await usersData.set(game.joueurs[1], {
          money: (await usersData.get(game.joueurs[1])).money + remboursement
        });
      }

      message.reply(
        "🤝 𝗘́𝗴𝗮𝗹𝗶𝘁𝗲́ !\n━━━━━━━━━━━━\n💰 Les deux joueurs récupèrent leur mise\n\n" +
        this.getBoardDisplay(game.plateau)
      );
      delete global.connect4Games[messageID];
      return;
    }

    // Changement de joueur
    game.joueurActuel = 1 - game.joueurActuel;

    // Coup de l'IA en PvE
    if (game.typeDeJeu === "pve" && game.joueurActuel === 1) {
      const botCol = this.getBotMove(game.plateau);
      const botLigne = this.makeMove(game.plateau, botCol, 2);

      if (this.checkWin(game.plateau, botLigne, botCol)) {
        message.reply(
          `🎯 𝗙𝗜𝗡 𝗗𝗨 𝗝𝗘𝗨 🎯\n━━━━━━━━━━━━\n🤖 𝗟𝗲 𝗯𝗼𝘁 𝗮 𝗴𝗮𝗴𝗻𝗲́ !\n\n${this.getBoardDisplay(game.plateau)}`
        );
        delete global.connect4Games[messageID];
        return;
      }

      game.joueurActuel = 0;
    }

    // Mise à jour de l'affichage
    await message.reply(
      `🎮 𝗣𝗨𝗜𝗦𝗦𝗔𝗡𝗖𝗘 𝟰 🎮\n━━━━━━━━━━━━\n` +
      `${game.typeDeJeu === "pve" ? "🤖 IA" : "👥 PvP"} | 💰 Pot : ${game.mise * 2} pièces\n\n` +
      `${this.getBoardDisplay(game.plateau)}\n\n` +
      `🔹 Tour actuel : ${await this.getPlayerName(api, game.joueurs[game.joueurActuel])}\n` +
      "💬 Répondez avec une colonne (1-6)"
    );
    api.unsendMessage(messageID);
  },

  // Fonctions utilitaires identiques, juste les noms traduits
  makeMove(board, col, player) {
    if (col < 0 || col > 5 || board[0][col] !== 0) return -1;
    for (let row = 5; row >= 0; row--) {
      if (board[row][col] === 0) {
        board[row][col] = player;
        return row;
      }
    }
    return -1;
  },

  getBotMove(board) {
    // Tentative de victoire
    for (let col = 0; col < 6; col++) {
      const testBoard = JSON.parse(JSON.stringify(board));
      const row = this.makeMove(testBoard, col, 2);
      if (row !== -1 && this.checkWin(testBoard, row, col)) {
        return col;
      }
    }
    // Blocage joueur
    for (let col = 0; col < 6; col++) {
      const testBoard = JSON.parse(JSON.stringify(board));
      const row = this.makeMove(testBoard, col, 1);
      if (row !== -1 && this.checkWin(testBoard, row, col)) {
        return col;
      }
    }
    // Préférence centre
    if (board[5][3] === 0) return 3;
    // Coup aléatoire
    const validCols = [];
    for (let col = 0; col < 6; col++) {
      if (board[0][col] === 0) validCols.push(col);
    }
    return validCols[Math.floor(Math.random() * validCols.length)];
  },

  checkWin(board, row, col) {
    const player = board[row][col];
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];

    return dirs.some(([dx, dy]) => {
      let count = 1;
      for (let i=1;i<4;i++){
        const r=row+i*dx, c=col+i*dy;
        if(r<0||r>=6||c<0||c>=6||board[r][c]!==player) break;
        count++;
      }
      for (let i=1;i<4;i++){
        const r=row-i*dx, c=col-i*dy;
        if(r<0||r>=6||c<0||c>=6||board[r][c]!==player) break;
        count++;
      }
      return count>=4;
    });
  },

  isBoardFull(board) {
    return board[0].every(cell => cell !== 0);
  },

  getBoardDisplay(board) {
    const symbols = ['⬜', '🔴', '🟡'];
    let display = '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣\n';
    for (const row of board) {
      display += row.map(cell => symbols[cell]).join('') + '\n';
    }
    return display;
  },

  async getPlayerName(api, userID) {
    try {
      if (userID === "bot") return "🤖 Bot";
      const info = await api.getUserInfo(userID);
      return info[userID].name || `Joueur ${userID}`;
    } catch {
      return `Joueur ${userID}`;
    }
  }
};