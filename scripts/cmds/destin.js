module.exports = {
  config: {
    name: "destin",
    aliases: ["destin", "fate"],
    version: "2.0",
    author: "Christus",
    role: 0,
    category: "fun",
    shortDescription: {
      fr: "🔮 Système de prédiction personnelle"
    },
    longDescription: {
      fr: "Fournit une prédiction détaillée pour l’utilisateur (mort, amour, enfants, talents, richesse, etc.)"
    },
    guide: {
      fr: "vaggo [nom/ID] (facultatif)"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      // Déterminer l'utilisateur cible
      let targetName, targetID;
      if (args.length > 0) {
        targetID = Object.keys(event.mentions)[0] || args[0];
        try {
          const userInfo = await api.getUserInfo(targetID);
          targetName = userInfo[targetID].name;
        } catch {
          targetName = args.join(" ");
        }
      } else {
        targetID = event.senderID;
        const userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name;
      }

      // Créer une graine depuis l’ID utilisateur (même personne = mêmes résultats)
      const seed = targetID.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
      const random = (min, max) => Math.floor((seed % (max - min + 1)) + min);

      // Prédictions pour chaque catégorie
      const predictions = {
        death: [
          `⚰️ ${targetName}, tu partiras paisiblement dans ton sommeil une nuit d'hiver…`,
          `⚰️ ${targetName}, tu mourras à 82 ans, aux côtés d’une personne très spéciale.`,
          `⚰️ ${targetName}, un accident changera ton destin de manière inattendue.`,
          `⚰️ ${targetName}, tu vivras à jamais à travers ce que tu auras créé.`,
          `⚰️ ${targetName}, tes derniers jours seront passés très proche de la nature.`,
          `⚰️ ${targetName}, après ta mort, les gens raconteront ton histoire pendant des années.`,
          `⚰️ ${targetName}, tu partiras le jour où tu t’y attendras le moins.`,
          `⚰️ ${targetName}, ton dernier souhait sera de sourire en regardant le ciel.`,
          `⚰️ ${targetName}, tu mourras mais ton œuvre restera dans le cœur des gens.`,
          `⚰️ ${targetName}, tu partiras dans l’endroit où tu trouves la plus grande paix.`,
          `⚰️ ${targetName}, tu quitteras ce monde au moment où tout semblera parfait.`,
          `⚰️ ${targetName}, ta vie se terminera comme une chanson inachevée.`,
          `⚰️ ${targetName}, tu laisseras derrière toi de nombreuses questions sans réponse.`,
          `⚰️ ${targetName}, personne ne sera là à ton dernier moment, mais tout le monde se souviendra de toi.`,
          `⚰️ ${targetName}, tu mourras à cause d’un malentendu.`,
          `⚰️ ${targetName}, ta mort viendra de quelqu’un en qui tu as confiance.`,
          `⚰️ ${targetName}, ton journal rendra ton nom immortel.`,
          `⚰️ ${targetName}, tes dernières paroles seront aussi belles qu’un poème.`,
          `⚰️ ${targetName}, tu partiras quand tout le monde pensera que tu es le plus fort.`,
          `⚰️ ${targetName}, ta vie se terminera comme une histoire inachevée.`
        ],
        child: [
          `👶 ${targetName}, ton prochain enfant sera une fille, et elle étonnera tout le monde par son intelligence.`,
          `👶 ${targetName}, ton enfant sera introverti mais plein de rêves.`,
          `👶 ${targetName}, ton enfant naîtra en ${["avril", "octobre", "décembre", "juillet", "février"][random(0,4)]}.`,
          `👶 ${targetName}, ton enfant sera ${["un amoureux de la musique", "un technicien", "un athlète", "un artiste", "un écrivain"][random(0,4)]}.`,
          `👶 ${targetName}, ton enfant deviendra plus célèbre que toi.`,
          `👶 ${targetName}, ton enfant naîtra avec un talent rare.`,
          `👶 ${targetName}, ton enfant fera ses études à l’étranger.`,
          `👶 ${targetName}, ton enfant sera ta plus grande fierté.`,
          `👶 ${targetName}, ton enfant découvrira quelque chose qui changera le monde.`,
          `👶 ${targetName}, les yeux de ton enfant refléteront les tiens.`
        ],
        love: [
          `💞 ${targetName}, ta moitié sera une personne que tu n’as jamais vraiment remarquée.`,
          `💞 ${targetName}, ton amour apparaîtra de façon inattendue, peut-être ${["à une foire", "en voyage", "au travail", "à l'hôpital", "en ligne"][random(0,4)]}.`,
          `💞 ${targetName}, tu tomberas amoureux(se) d’une personne étrangère.`,
          `💞 ${targetName}, l’amour viendra quand tu t’y attendras le moins.`,
          `💞 ${targetName}, ton/ta partenaire sera un(e) ami(e) de longue date.`,
          `💞 ${targetName}, tu tomberas amoureux(se) de quelqu’un avec qui tu débats souvent.`,
          `💞 ${targetName}, tu te marieras à l’âge de ${random(25,40)} ans.`,
          `💞 ${targetName}, ton histoire d’amour sera digne d’un film.`,
          `💞 ${targetName}, ta journée de mariage sera pluvieuse et romantique.`,
          `💞 ${targetName}, tu tomberas amoureux(se) deux fois, mais tu ne te marieras qu’une seule fois.`
        ],
        talent: [
          `🧠 ${targetName}, tu caches en toi un(e) ${["poète", "inventeur", "leader", "artiste", "chercheur"][random(0,4)]}.`,
          `🧠 ${targetName}, tu as le don des mots — un jour, tes écrits feront pleurer.`,
          `🧠 ${targetName}, ta créativité sommeille encore, attendant d’être révélée.`,
          `🧠 ${targetName}, tu possèdes une compétence que tu n’as pas encore découverte.`,
          `🧠 ${targetName}, tu as une capacité rare à comprendre les gens.`,
          `🧠 ${targetName}, ton esprit fonctionne différemment des autres.`,
          `🧠 ${targetName}, si tu t’essaies à ${["chanter", "peindre", "écrire", "danser", "jouer la comédie"][random(0,4)]}, tu réussiras.`
        ],
        luck: [
          `🍀 ${targetName}, tes numéros porte-bonheur sont : ${random(1,9)}, ${random(10,20)}, ${random(21,30)}.`,
          `🍀 ${targetName}, la couleur ${["rouge", "bleu", "blanc", "vert", "violet"][random(0,4)]} t’apportera chance.`,
          `🍀 ${targetName}, le ${random(5,30)} du mois sera un jour spécial pour toi.`,
          `🍀 ${targetName}, ${["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"][random(0,6)]} est ton jour de chance.`,
          `🍀 ${targetName}, si tu voyages vers le ${["est", "ouest", "nord", "sud"][random(0,3)]}, tu auras de la chance.`
        ],
        wealth: [
          `💰 ${targetName}, ta richesse viendra soudainement grâce à ${["un ami", "une invention", "une décision", "un voyage", "un accident"][random(0,4)]}.`,
          `💰 ${targetName}, ta fortune viendra de ${["ton travail", "ta chance", "un héritage", "un investissement", "ta créativité"][random(0,4)]}.`,
          `💰 ${targetName}, tu commenceras une entreprise qui changera ta vie.`,
          `💰 ${targetName}, tu gagneras de l’argent en faisant ce que tu aimes.`,
          `💰 ${targetName}, ta plus grande réussite financière arrivera en ${random(2025,2040)}.`
        ],
        pastLife: [
          `🌌 ${targetName}, dans une vie antérieure, tu étais ${["un guerrier", "un poète", "un fermier", "un artiste", "un prêtre", "un marchand", "un guérisseur"][random(0,6)]}.`,
          `🌌 ${targetName}, ton âme appartenait à ${["une famille royale", "une famille pauvre", "un sage", "un artiste", "un guerrier"][random(0,4)]}.`,
          `🌌 ${targetName}, certaines de tes quêtes inachevées de ton ancienne vie se réaliseront dans celle-ci.`,
          `🌌 ${targetName}, tu es mort(e) ${["dans une bataille", "dans un accident", "d’une maladie", "dans une catastrophe naturelle"][random(0,3)]} dans ta vie passée.`,
          `🌌 ${targetName}, un secret de ta vie passée sera révélé dans cette vie.`
        ]
      };

      // Sélection aléatoire pour chaque catégorie
      const deathPred = predictions.death[random(0, predictions.death.length - 1)];
      const childPred = predictions.child[random(0, predictions.child.length - 1)];
      const lovePred = predictions.love[random(0, predictions.love.length - 1)];
      const talentPred = predictions.talent[random(0, predictions.talent.length - 1)];
      const luckPred = predictions.luck[random(0, predictions.luck.length - 1)];
      const wealthPred = predictions.wealth[random(0, predictions.wealth.length - 1)];
      const pastLifePred = predictions.pastLife[random(0, predictions.pastLife.length - 1)];

      // Message final
      const finalMessage =
        `🔮 ${targetName}, voici ta prédiction personnelle...\n\n` +
        `${deathPred}\n\n` +
        `${childPred}\n\n` +
        `${lovePred}\n\n` +
        `${talentPred}\n\n` +
        `${luckPred}\n\n` +
        `${wealthPred}\n\n` +
        `${pastLifePred}\n\n` +
        `✨ Le destin peut toujours changer — tes actions déterminent ta véritable avenir ✨`;

      api.sendMessage(finalMessage, event.threadID);

    } catch (error) {
      console.error("Erreur de prédiction :", error);
      api.sendMessage("🔮 Une erreur est survenue lors de la prédiction, réessaie plus tard...", event.threadID);
    }
  }
};