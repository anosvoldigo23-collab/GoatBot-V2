const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "fbcover",
    version: "0.1.0",
    author: "Christus",
    role: 0,
    shortDescription: "Générer une couverture Facebook",
    longDescription: "Crée une couverture Facebook en utilisant vos informations",
    category: "image",
    guide: {
      fr: "-fbcover Nom | Prénom | Email | Téléphone | Adresse | Couleur"
    }
  },

  onStart: async function ({ message, event, args }) {
    const input = args.join(" ").split("|").map(item => item.trim());

    if (input.length < 6) {
      return message.reply("❌ Veuillez fournir les 6 champs :\nNom | Prénom | Email | Téléphone | Adresse | Couleur");
    }

    const [name, subname, email, phoneNumber, address, color] = input;
    const uid = event.senderID;

    const waitMsg = await message.reply("🖼 Génération de votre couverture Facebook...");

    try {
      const boldApi = "http://65.109.80.126:20409/aryan/font?style=bold";
      const [
        boldName,
        boldEmail,
        boldPhone,
        boldAddress,
        boldColor
      ] = await Promise.all([
        axios.get(`${boldApi}&text=${encodeURIComponent(name)}`),
        axios.get(`${boldApi}&text=${encodeURIComponent(email)}`),
        axios.get(`${boldApi}&text=${encodeURIComponent(phoneNumber)}`),
        axios.get(`${boldApi}&text=${encodeURIComponent(address)}`),
        axios.get(`${boldApi}&text=${encodeURIComponent(color)}`)
      ]);

      const apiUrl = `http://65.109.80.126:20409/aryan/fbcover?name=${encodeURIComponent(name)}&uid=${uid}&subname=${encodeURIComponent(subname)}&email=${encodeURIComponent(email)}&phoneNumber=${encodeURIComponent(phoneNumber)}&address=${encodeURIComponent(address)}&color=${encodeURIComponent(color)}`;

      const imgBuffer = (await axios.get(apiUrl, { responseType: "arraybuffer" })).data;

      const fileName = `fbcover-${Date.now()}.png`;
      const filePath = path.join(__dirname, "cache", fileName);
      fs.writeFileSync(filePath, Buffer.from(imgBuffer, "utf-8"));

      await message.reply({
        body:
`✅ Couverture Facebook créée !

👤 Nom : ${boldName.data.result}
📧 Email : ${boldEmail.data.result}
📱 Téléphone : ${boldPhone.data.result}
📍 Adresse : ${boldAddress.data.result}
🎨 Couleur : ${boldColor.data.result}`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(err);
      message.reply("❌ Erreur lors de la génération de la couverture Facebook. Veuillez réessayer plus tard.");
    }

    if (waitMsg) {
      message.unsend(waitMsg.messageID);
    }
  }
};