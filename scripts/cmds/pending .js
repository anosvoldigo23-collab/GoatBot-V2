module.exports = {
  config: {
    name: "pen", // Nom de la commande
    version: "1.1", // Version de la commande
    author: "Christus", // Auteur de la commande
    countDown: 5, // Temps de refroidissement (en secondes)
    role: 2, // Niveau de rôle requis pour utiliser la commande (2 = admin)
    shortDescription: {
      en: "Gérer les demandes de groupe en attente"
    },
    longDescription: {
      en: "Approuver ou rejeter les demandes de groupe en attente dans la liste des spams ou les groupes non approuvés"
    },
    category: "admin", // Catégorie de la commande
    guide: {
      en: "{pn} - afficher la liste des demandes en attente\n{pn} approve <numéros> - approuver les groupes sélectionnés\n{pn} cancel <numéros> - rejeter les groupes sélectionnés"
    }
  },
  langs: {
    en: {
      invalidNumber: "⚠️ | Entrée invalide\n━━━━━━━━━━━━━━\n\n» %1 n'est pas un nombre valide. Veuillez entrer uniquement des nombres.",
      cancelSuccess: "❌ | Demande rejetée\n━━━━━━━━━━━━━━\n\n» Rejet avec succès de %1 demande(s) de groupe.",
      approveSuccess: "✅ | Demande approuvée\n━━━━━━━━━━━━━━\n\n» Approuvé avec succès %1 groupe(s).",
      cantGetPendingList: "⚠️ | Erreur\n━━━━━━━━━━━━━━\n\n» Échec de la récupération de la liste des demandes en attente. Veuillez réessayer plus tard.",
      returnListPending: "📋 | Groupes en attente (%1)\n━━━━━━━━━━━━━━\n\n%2\n» Répondre avec :\n» 'approve <numéros>' pour approuver\n» 'cancel <numéros>' pour rejeter\n» Exemple : 'pending approve 1 2 3'",
      returnListClean: "ℹ️ | Pas de groupes en attente\n━━━━━━━━━━━━━━\n\n» Il n'y a actuellement aucun groupe dans la liste des demandes en attente.",
      noSelection: "⚠️ | Entrée manquante\n━━━━━━━━━━━━━━\n\n» Veuillez spécifier quels groupes traiter.\n» Exemple : 'pending approve 1 2 3'",
      instruction: "📝 | Instructions\n━━━━━━━━━━━━━━\n\n1. Afficher les groupes en attente avec '{pn}'\n2. Approuver avec '{pn} approve <numéros>'\n3. Rejeter avec '{pn} cancel <numéros>'\n\nExemple :\n» '{pn} approve 1 2 3'\n» '{pn} cancel 4 5'"
    }
  },
  onStart: async function({ api, event, getLang, commandName, args }) {
    const { threadID, messageID } = event;

    if (args[0]?.toLowerCase() === 'help') {
      return api.sendMessage(getLang("instruction").replace(/{pn}/g, commandName), threadID, messageID);
    }

    try {
      const [spam, pending] = await Promise.all([
        api.getThreadList(100, null, ["OTHER"]).catch(() => []),
        api.getThreadList(100, null, ["PENDING"]).catch(() => [])
      ]);

      const list = [...spam, ...pending]
        .filter(group => group.isSubscribed && group.isGroup)
        .map((group, index) => ({
          ...group,
          displayIndex: index + 1
        }));

      if (list.length === 0) {
        return api.sendMessage(getLang("returnListClean"), threadID, messageID);
      }

      const msg = list.map(group =>
        `╭───────────────\n` +
        `│ ${group.displayIndex}. ${group.name || 'Groupe sans nom'}\n` +
        `│ 👥 Membres : ${group.participantIDs.length}\n` +
        `│ 🆔 ID : ${group.threadID}\n` +
        `╰───────────────`
      ).join('\n\n');

      const replyMsg = await api.sendMessage(
        getLang("returnListPending", list.length, msg).replace(/{pn}/g, commandName),
        threadID,
        (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              pending: list
            });
          }
        },
        messageID
      );

      setTimeout(() => {
        if (global.GoatBot.onReply.has(replyMsg.messageID)) {
          global.GoatBot.onReply.delete(replyMsg.messageID);
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error(error);
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }
  },
  onReply: async function({ api, event, Reply, getLang, commandName }) {
    if (String(event.senderID) !== String(Reply.author)) return;

    const { body, threadID, messageID } = event;
    const args = body.trim().split(/\s+/);
    const action = args[0]?.toLowerCase();

    if (!action || (action !== 'approve' && action !== 'cancel')) {
      return api.sendMessage(
        getLang("noSelection").replace(/{pn}/g, commandName),
        threadID,
        messageID
      );
    }

    const numbers = args.slice(1).map(num => parseInt(num)).filter(num => !isNaN(num));

    if (numbers.length === 0) {
      return api.sendMessage(getLang("invalidNumber", "sélection vide"), threadID, messageID);
    }

    const invalidNumbers = numbers.filter(num => num <= 0 || num > Reply.pending.length);
    if (invalidNumbers.length > 0) {
      return api.sendMessage(
        getLang("invalidNumber", invalidNumbers.join(', ')),
        threadID,
        messageID
      );
    }

    const selectedGroups = numbers.map(num => Reply.pending[num - 1]);
    let successCount = 0;

    for (const group of selectedGroups) {
      try {
        if (action === 'approve') {
          await api.sendMessage(
            "🔔 | Notification de groupe\n━━━━━━━━━━━━━━\n\n» Ce groupe a été approuvé par l'administrateur.",
            group.threadID
          );
          successCount++;
        } else {
          await api.removeUserFromGroup(api.getCurrentUserID(), group.threadID);
          successCount++;
        }
      } catch (error) {
        console.error(`Échec du traitement du groupe ${group.threadID}:`, error);
      }
    }

    const resultMessage = action === 'approve'
      ? getLang("approveSuccess", successCount)
      : getLang("cancelSuccess", successCount);

    api.sendMessage(resultMessage, threadID, messageID);

    if (global.GoatBot.onReply.has(Reply.messageID)) {
      global.GoatBot.onReply.delete(Reply.messageID);
    }
  }
};