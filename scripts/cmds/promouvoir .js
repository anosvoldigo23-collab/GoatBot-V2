module.exports = {
  config: {
    name: "promouvoir", // Nom de la commande
    version: "1.0",
    author: "Christus", // Auteur de la commande
    countDown: 5, // Délai d'attente avant de pouvoir réutiliser la commande (en secondes)
    role: 1, // Niveau de rôle requis pour utiliser la commande (peut être ajusté selon vos besoins)
    shortDescription: "Ajouter un administrateur de groupe", // Description courte de la commande
    longDescription: "Ajoute la personne que vous taguez en tant qu'administrateur du groupe.", // Description longue de la commande
    category: "discussion de groupe", // Catégorie de la commande (ex: commandes de groupe, utilitaires, etc.)
    guide: {
      en: "{p}{n} [tag]", // Guide d'utilisation en anglais (ici, {p} représente le préfixe de la commande et {n} le nom de la commande)
    }
  },

  onStart: async function ({ api, event }) {
    var mention = Object.keys(event.mentions); // Récupère les personnes mentionnées dans le message
    return api.getThreadInfo(event.threadID, (err, info) => { // Récupère les informations du groupe
      if (err) return api.sendMessage("Une erreur s'est produite!", event.threadID); // Envoie un message d'erreur en cas de problème

      if (!info.adminIDs.some(item => item.id == api.getCurrentUserID())) return api.sendMessage('Besoin de la permission d\'administrateur du groupe.\n Veuillez m\'ajouter et réessayer !', event.threadID, event.messageID); // Vérifie si le bot est administrateur du groupe. Si non, affiche un message d'erreur.

      if (!mention[0]) return api.sendMessage("Vous devez taguer la personne à promouvoir.", event.threadID); // Vérifie si une personne a été taguée. Si non, affiche un message d'erreur.

      if (info.adminIDs.some(item => item.id == event.senderID)) { // Vérifie si l'utilisateur qui a exécuté la commande est un administrateur du groupe
        for (let o in mention) { // Boucle à travers les personnes mentionnées
          setTimeout(() => {
            api.changeAdminStatus(event.threadID, mention[o], true); // Rend la personne mentionnée administrateur du groupe.
          }, 3000) // Délai de 3 secondes avant de rendre l'utilisateur administrateur pour éviter les erreurs.
        }
      }
    })
  }
};