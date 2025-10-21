const fsp = require('fs').promises;

module.exports.config = {
  name: "file",
  version: "1.0.0",
  role: 2,
  author: "Christus",
  usePrefix: true,
  description: "Envoie le contenu brut d'un fichier depuis le dossier scripts/cmds",
  category: "utilitaire",
  guide: { fr: "[nomDuFichier]" },
  countDown: 1
};

module.exports.onStart = async function({ api, event, args }) {
  if (args.length === 0) {
    return api.sendMessage("[⚜]➜ Veuillez fournir le nom du fichier.", event.threadID, event.messageID);
  }

  const fileName = args[0];
  const filePath = `scripts/cmds/${fileName}.js`;

  try {
    const content = await fsp.readFile(filePath, "utf8");
    await api.sendMessage(content, event.threadID, event.messageID);
  } catch (err) {
    console.error(err);
    api.sendMessage("[⚜]➜ Fichier introuvable ou impossible à lire.", event.threadID, event.messageID);
  }
};