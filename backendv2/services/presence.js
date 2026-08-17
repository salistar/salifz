/**
 * Présence en ligne — source unique.
 *
 * `routes/social.js` renvoyait `isOnline: Math.random() > 0.5` : la liste
 * d'amis affichait un point vert ou gris tiré à pile ou face, ce qui est pire
 * que de ne rien afficher — on croit l'information.
 *
 * La vraie présence est déjà connue : chaque socket authentifié porte son
 * utilisateur. On interroge donc la couche Socket.IO. `fetchSockets()` passe
 * par l'adaptateur Redis quand il est actif, et couvre alors toutes les
 * instances du serveur, pas seulement celle qui répond à la requête — une
 * table locale se tromperait dès la deuxième instance.
 */

let io = null;

function register(instance) {
  io = instance;
}

/**
 * Renvoie l'ensemble des identifiants connectés, sous forme de chaînes.
 * En l'absence de couche temps réel (tests, scripts), renvoie un ensemble
 * vide : personne n'est en ligne, ce qui est exact plutôt qu'inventé.
 */
async function onlineUserIds() {
  if (!io) return new Set();
  try {
    const sockets = await io.fetchSockets();
    return new Set(sockets.map((s) => s.data?.userId).filter(Boolean));
  } catch (error) {
    // Un adaptateur Redis indisponible ne doit pas faire échouer la page :
    // on dégrade vers « personne en ligne », signalé par le second retour.
    console.error('[presence] lecture impossible :', error.message);
    return new Set();
  }
}

/** Vrai si la couche temps réel répond — permet à l'appelant de distinguer
 *  « personne en ligne » de « présence inconnue ». */
function isAvailable() {
  return io !== null;
}

module.exports = { register, onlineUserIds, isAvailable };
