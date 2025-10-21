const axios = require("axios");

module.exports = {
  config: {
    name: "apitest",
    aliases: ["api", "apicall"],
    version: "1.0",
    author: "Christus",
    countDown: 10,
    role: 0,
    description: "Teste un endpoint API donné avec différentes méthodes HTTP et données.",
    category: "utilitaire",
    guide: {
      fr: "{pn} <méthode> <url> [headers] [body]\n\nExemple pour GET : {pn} get https://api.example.com/data?id=123\n\nExemple pour POST : {pn} post https://api.example.com/users {\"name\":\"John\"} {\"Content-Type\":\"application/json\"}\n\nRemarque : Les headers et le corps doivent être des chaînes JSON valides."
    }
  },

  onStart: async function ({ api, event, args }) {
    const [method, url, headersString, bodyString] = args;

    if (!method || !url) {
      return api.sendMessage(this.config.guide.fr, event.threadID, event.messageID);
    }

    const httpMethod = method.toUpperCase();
    let requestHeaders = {};
    let requestBody = {};

    // Parser les headers si fournis
    if (headersString) {
      try {
        requestHeaders = JSON.parse(headersString);
      } catch (e) {
        return api.sendMessage("❌ Headers invalides. Veuillez utiliser un format JSON valide pour les headers.", event.threadID, event.messageID);
      }
    }

    // Parser le body si fourni
    if (bodyString) {
      try {
        requestBody = JSON.parse(bodyString);
      } catch (e) {
        return api.sendMessage("❌ Corps de requête invalide. Veuillez utiliser un format JSON valide pour le body.", event.threadID, event.messageID);
      }
    }

    try {
      let response;
      const config = { headers: requestHeaders };

      switch (httpMethod) {
        case "GET":
          response = await axios.get(url, config);
          break;
        case "POST":
          response = await axios.post(url, requestBody, config);
          break;
        case "PUT":
          response = await axios.put(url, requestBody, config);
          break;
        case "DELETE":
          response = await axios.delete(url, { ...config, data: requestBody });
          break;
        default:
          return api.sendMessage("❌ Méthode HTTP invalide. Méthodes supportées : GET, POST, PUT, DELETE.", event.threadID, event.messageID);
      }

      const responseBody = JSON.stringify(response.data, null, 2);
      const statusCode = response.status;
      const statusText = response.statusText;

      const replyMessage = `✅ Résultat du test API\n\n` +
                           `URL : ${url}\n` +
                           `Méthode : ${httpMethod}\n` +
                           `Code statut : ${statusCode} ${statusText}\n\n` +
                           `Corps de la réponse :\n` +
                           `\`\`\`json\n${responseBody}\n\`\`\``;

      api.sendMessage(replyMessage, event.threadID, event.messageID);

    } catch (e) {
      const errorMessage = e.response ? `Statut : ${e.response.status}\nMessage : ${e.response.statusText}` : e.message;
      api.sendMessage(`❌ La requête API a échoué.\n\nErreur : ${errorMessage}`, event.threadID, event.messageID);
    }
  }
};