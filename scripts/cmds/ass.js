module.exports = {
  config: {
    name: "ass",
    version: "1.0",
    author: "Aesther x Christus",
    countDown: 5,
    role: 0,
    shortDescription: "🍑 Envoie une image aléatoire d'ass",
    longDescription: "Envoie une image aléatoire de type ass depuis l'API WaifuSM.",
    category: "nsfw",
    guide: "{pn}"
  },

  onStart: async function({ message }) {
    try {
      // Clear cache simulated
      // Fetch and send the image directly
      await message.reply({
        body: "🍑 Voici une image aléatoire :",
        attachment: await global.utils.getStreamFromURL("https://archive.lick.eu.org/api/waifusm/ass")
      });
    } catch (e) {
      console.error(e);
      return message.reply("❌ Une erreur est survenue en récupérant l'image.");
    }
  }
};