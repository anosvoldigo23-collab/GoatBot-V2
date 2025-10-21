module.exports = {
	config: {
		name: "botsay",
		version: "1.0",
		author: "Christus",
		role: 0,
		category: "texte",
		guide: {
			fr: "botsay + (Message que vous voulez que le bot répète)"
		}   
	},

	onStart: async function ({ api, args, event }) {
		const say = args.join(" ");
		if (!say) {
			api.sendMessage("Veuillez entrer un message", event.threadID, event.messageID);
		} else {
			api.sendMessage(`${say}`, event.threadID, event.messageID);
		}
	}

};