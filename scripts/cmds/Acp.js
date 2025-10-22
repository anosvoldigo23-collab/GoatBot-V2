const moment = require("moment-timezone");

// 🌸 Icônes et décorations
const LINE = "━━━━━━━━━━━━━━━━━━━";
const ARROW = "➤";
const CHECK = "✅";
const CROSS = "❌";
const INFO = "💬";
const CLOCK = "⏰";
const HEART = "💗";
const PROFILE = "👤";

module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "2.5",
    author: "Christus",
    countDown: 15,
    role: 2,
    shortDescription: "💗 Gérer les demandes d’amis",
    longDescription: "Affiche et gère les demandes d’amis entrantes : accepte ou supprime selon ton choix.",
    category: "Utility",
  },

  // 📜 Étape 1 : afficher les demandes
  onStart: async function ({ event, api, commandName }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };

      const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(res).data.viewer.friending_possibilities.edges;

      if (!listRequest || !listRequest.length) {
        return api.sendMessage(`${CROSS} Aucune demande d’ami en attente.`, event.threadID);
      }

      // 🖋️ Message stylé
      let msg = `\n${LINE}\n${HEART} 𝐍𝐎𝐔𝐕𝐄𝐋𝐋𝐄𝐒 𝐃𝐄𝐌𝐀𝐍𝐃𝐄𝐒 𝐃’𝐀𝐌𝐈𝐒\n${LINE}\n`;
      listRequest.forEach((u, i) => {
        msg += `\n${ARROW} ${PROFILE} ${u.node.name}\n`;
        msg += `🆔 ID: ${u.node.id}\n`;
        msg += `🔗 Lien: ${u.node.url.replace("www.facebook", "fb")}\n`;
        msg += `${CLOCK} Reçu: ${moment(u.time * 1000).tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss")}\n`;
      });
      msg += `\n${LINE}\n${INFO} Réponds avec : add | del <numéro | all>\n${LINE}`;

      api.sendMessage(msg, event.threadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          unsendTimeout: setTimeout(() => api.unsendMessage(info.messageID), 60000),
        });
      });
    } catch (e) {
      console.error(e);
      api.sendMessage(`${CROSS} Erreur lors de la récupération des demandes.`, event.threadID);
    }
  },

  // ⚙️ Étape 2 : agir sur les demandes via réponse
  onReply: async function ({ event, Reply, api }) {
    if (event.senderID !== Reply.author) return;
    clearTimeout(Reply.unsendTimeout);

    const args = event.body.trim().toLowerCase().split(/\s+/);
    const action = args[0];
    const listRequest = Reply.listRequest;

    if (!["add", "del"].includes(action)) {
      return api.sendMessage(`${INFO} Utilise : add | del <numéro | all>`, event.threadID);
    }

    let targetIDs = args.slice(1);
    if (args[1] === "all") targetIDs = listRequest.map((_, i) => i + 1);

    const success = [];
    const failed = [];

    // Paramètres communs pour les requêtes
    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.floor(Math.random() * 10000).toString(),
          friend_requester_id: null,
        },
        scale: 3,
        refresh_num: 0,
      },
      fb_api_req_friendly_name: "",
      doc_id: "",
    };

    if (action === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    } else {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }

    // 💬 Exécution des actions
    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(`#${stt} introuvable`);
        continue;
      }

      form.variables.input.friend_requester_id = user.node.id;
      const payload = { ...form, variables: JSON.stringify(form.variables) };

      try {
        const res = await api.httpPost("https://www.facebook.com/api/graphql/", payload);
        const json = JSON.parse(res);
        if (json.errors) failed.push(user.node.name);
        else success.push(user.node.name);
      } catch {
        failed.push(user.node.name);
      }
    }

    // 🧾 Résumé final
    let replyMsg = `\n${LINE}\n${HEART} 𝐑𝐄́𝐒𝐔𝐋𝐓𝐀𝐓 𝐃𝐄 𝐋’𝐀𝐂𝐓𝐈𝐎𝐍\n${LINE}\n`;
    if (success.length)
      replyMsg += `${CHECK} ${success.length} ${action === "add" ? "acceptée(s)" : "supprimée(s)"}:\n${success.map(n => `   ${ARROW} ${n}`).join("\n")}\n`;
    if (failed.length)
      replyMsg += `\n${CROSS} Erreurs (${failed.length}):\n${failed.map(n => `   ${ARROW} ${n}`).join("\n")}\n`;
    replyMsg += `${LINE}\n${CLOCK} Terminé à ${moment().tz("Asia/Manila").format("HH:mm:ss")}\n${LINE}`;

    await api.sendMessage(replyMsg, event.threadID);
    api.unsendMessage(Reply.messageID);
  },
};
