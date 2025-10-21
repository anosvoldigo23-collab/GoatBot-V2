module.exports = {
  config: {
    name: "leave", // Nom de la commande
    version: "1.1", // Version de la commande
    author: "Christus x Aesther", // Auteur de la commande
    countDown: 10, // Délai d'attente avant de pouvoir réutiliser la commande (en secondes)
    role: 2, // Niveau de rôle requis pour utiliser la commande (0 : tout le monde, 1 : modérateur, 2 : propriétaire, etc.)
    shortDescription: {
      en: "Liste les groupes et quitte le groupe sélectionné" // Description courte en anglais
    },
    longDescription: {
      en: "Affiche les groupes où le bot est membre (8 par page).  En répondant avec un numéro, le bot envoie un message d'adieu dans ce groupe puis le quitte." // Description longue en anglais
    },
    category: "owner", // Catégorie de la commande (ex : owner, utilitaire, fun)
    guide: {
      en: "{p}leave → liste les groupes\nRépondre avec un numéro → le bot quitte le groupe\nRépondre 'next'/'prev' → pagination" // Guide d'utilisation en anglais (les instructions sont séparées par \n)
    }
  },

  onStart: async function ({ api, message, threadsData, event }) { // Fonction exécutée au démarrage de la commande
    const allThreads = await threadsData.getAll(); // Récupère toutes les informations sur les fils de discussion (groupes et conversations individuelles)
    const groups = allThreads.filter(t => t.isGroup); // Filtre pour ne garder que les groupes

    if (groups.length === 0) return message.reply("❌ Aucun groupe trouvé."); // Si aucun groupe n'est trouvé, renvoie un message d'erreur

    const page = 1; // Définit la page actuelle à 1
    const perPage = 8; // Définit le nombre de groupes par page
    const totalPages = Math.ceil(groups.length / perPage); // Calcule le nombre total de pages

    const msg = await this.renderPage(api, groups, page, perPage, totalPages); // Appelle la fonction renderPage pour générer le message à envoyer
    return message.reply(msg, (err, info) => { // Envoie le message et enregistre une fonction de rappel pour gérer la réponse
      global.GoatBot.onReply.set(info.messageID, { // Enregistre les informations nécessaires pour gérer la réponse de l'utilisateur dans la variable globale GoatBot.onReply
        commandName: this.config.name, // Nom de la commande
        author: event.senderID, // ID de l'auteur de la commande
        groups, // Liste des groupes
        page, // Page actuelle
        perPage, // Nombre de groupes par page
        totalPages // Nombre total de pages
      });
    });
  },

  onReply: async function ({ api, message, event, Reply }) { // Fonction exécutée lorsque l'utilisateur répond au message de la commande
    if (event.senderID !== Reply.author) return; // Vérifie si l'auteur de la réponse est bien la personne qui a lancé la commande

    const body = event.body.trim().toLowerCase(); // Récupère le contenu de la réponse, supprime les espaces inutiles et le met en minuscule

    if (body === "next" || body === "prev") { // Si la réponse est "next" ou "prev" (pour naviguer entre les pages)
      let newPage = Reply.page; // Récupère la page actuelle
      if (body === "next" && Reply.page < Reply.totalPages) newPage++; // Si la réponse est "next" et qu'il y a une page suivante, incrémente la page
      else if (body === "prev" && Reply.page > 1) newPage--; // Si la réponse est "prev" et qu'il y a une page précédente, décrémente la page

      const msg = await this.renderPage(api, Reply.groups, newPage, Reply.perPage, Reply.totalPages); // Génère le nouveau message avec la page mise à jour
      return message.reply(msg, (err, info) => { // Envoie le nouveau message et met à jour les informations enregistrées pour la réponse
        global.GoatBot.onReply.set(info.messageID, {
          ...Reply, // Copie les anciennes informations
          page: newPage // Met à jour la page
        });
      });
    }

    const choice = parseInt(body); // Convertit la réponse en nombre entier
    if (isNaN(choice)) return message.reply("❌ Entrée invalide. Répondez avec un numéro, 'next' ou 'prev'."); // Si la conversion échoue, renvoie un message d'erreur

    const index = (Reply.page - 1) * Reply.perPage + (choice - 1); // Calcule l'index du groupe sélectionné dans la liste complète des groupes
    if (index < 0 || index >= Reply.groups.length) return message.reply("❌ Choix invalide."); // Si l'index est hors des limites, renvoie un message d'erreur

    const selectedGroup = Reply.groups[index]; // Récupère le groupe sélectionné

    const threadID = selectedGroup.threadID; // Récupère l'ID du fil de discussion du groupe

    try {
      const info = await api.getThreadInfo(threadID); // Récupère les informations sur le groupe
      const memberCount = info.participantIDs.length; // Récupère le nombre de membres du groupe

      const goodbyeBox = // Crée un message d'adieu formaté
        `┌──────────────┐\n` +
        `│ 👋 𝗕𝗼𝘁 𝗟𝗲𝗮𝘃𝗶𝗻𝗴\n` +
        `├──────────────┤\n` +
        `│ 📌 Groupe : ${info.threadName || "Sans nom"}\n` +
        `│ 🆔 ID : ${threadID}\n` +
        `│ 👥 Membres: ${memberCount}\n` +
        `└──────────────┘\n` +
        `🙏 Merci !`;

      await api.sendMessage(goodbyeBox, threadID); // Envoie le message d'adieu dans le groupe
      await api.removeUserFromGroup(api.getCurrentUserID(), threadID); // Fait quitter le bot du groupe

      return message.reply(`✅ Le bot a quitté le groupe : ${info.threadName || "Sans nom"} (${threadID})`); // Confirme le départ du bot
    } catch (err) {
      return message.reply(`❌ Erreur en quittant le groupe: ${err.message}`); // En cas d'erreur, renvoie un message d'erreur
    }
  },

  renderPage: async function (api, groups, page, perPage, totalPages) { // Fonction pour générer le message de la page
    let msg = `📦 Groupes où le bot est membre (Page ${page}/${totalPages}):\n\n`; // Début du message
    const start = (page - 1) * perPage; // Calcule l'index de début des groupes à afficher
    const end = Math.min(start + perPage, groups.length); // Calcule l'index de fin des groupes à afficher

    for (let i = start; i < end; i++) { // Parcourt les groupes de la page actuelle
      const g = groups[i];
      try {
        const info = await api.getThreadInfo(g.threadID); // Récupère les informations sur le groupe
        const approval = info.approvalMode ? "✅ Approuvé" : "❌ Non approuvé"; // Détermine si l'approbation est activée ou non
        const memberCount = info.participantIDs.length; // Récupère le nombre de membres

        msg += `${i - start + 1}. ${g.threadName || "Sans nom"}\n🆔 ${g.threadID}\n👥 Membres: ${memberCount}\n🔐 ${approval}\n\n`; // Ajoute les informations sur le groupe au message
      } catch {
        msg += `${i - start + 1}. ${g.threadName || "Sans nom"}\n🆔 ${g.threadID}\n⚠️ Impossible de récupérer les informations\n\n`; // En cas d'erreur, ajoute un message d'erreur
      }
    }

    msg += `👉 Répondez avec un numéro pour faire quitter le bot.\n`; // Instructions pour quitter le groupe
    if (page < totalPages) msg += `➡️ Répondez "next" pour la page suivante.\n`; // Instructions pour la page suivante
    if (page > 1) msg += `⬅️ Répondez "prev" pour la page précédente.\n`; // Instructions pour la page précédente

    return msg; // Retourne le message généré
  }
};