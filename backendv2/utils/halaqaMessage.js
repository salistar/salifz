/**
 * Forme unique d'un message de halaqa diffusé sur le socket.
 *
 * Elle porte les DEUX conventions à la fois, parce que les deux clients
 * historiques ne lisent pas la même :
 *  - le web lit la forme plate  : { text, senderId, senderName, timestamp }
 *  - le mobile lit l'enveloppe  : { halaqaId, message: { _id, sender, content } }
 * Diffuser l'une sans l'autre rend un des clients aveugle (c'est exactement
 * le bug qui a masqué l'absence de persistance pendant des semaines).
 */
function formatHalaqaMessage(halaqaId, saved, user) {
  const sender = {
    _id: String(user._id),
    username: user.username,
    displayName: user.displayName || user.username,
  };
  return {
    halaqaId: String(halaqaId),
    id: String(saved._id),
    senderId: sender._id,
    senderName: sender.displayName,
    text: saved.content,
    type: saved.type,
    timestamp: saved.createdAt,
    message: {
      _id: String(saved._id),
      sender,
      content: saved.content,
      type: saved.type,
      createdAt: saved.createdAt,
    },
  };
}

module.exports = { formatHalaqaMessage };
