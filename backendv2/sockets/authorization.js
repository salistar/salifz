/**
 * Autorisation des salons temps réel — Salifz
 *
 * Corrige S4. Auparavant `join-room`, `joinHalaqa` et `joinKhatam` acceptaient
 * n'importe quel identifiant sans vérifier que l'appelant était membre : un
 * client pouvait rejoindre et lire n'importe quelle conversation privée,
 * halaqa ou session de khatam — y compris sans être authentifié du tout.
 *
 * Ici, chaque type de salon a une règle d'accès explicite, et tout salon dont
 * le format n'est pas reconnu est refusé (liste blanche, pas liste noire).
 */

const mongoose = require('mongoose');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const model = (name) => {
  try {
    return require(`../models/${name}`);
  } catch {
    return null;
  }
};

/** L'utilisateur est-il responsable du khatam (créateur, ou modérateur de la halaqa d'accueil) ? */
async function isKhatamModerator(userId, khatamId) {
  if (!isObjectId(khatamId)) return false;
  const Khatam = model('Khatam');
  if (!Khatam) return false;

  const khatam = await Khatam.findById(khatamId).select('owner createdBy halaqaId').lean();
  if (!khatam) return false;

  if (String(khatam.owner || khatam.createdBy || '') === String(userId)) return true;
  if (khatam.halaqaId) return isHalaqaModerator(userId, khatam.halaqaId);

  return false;
}

/**
 * L'utilisateur est-il membre de la halaqa ?
 *
 * Le champ propriétaire du schéma est `creator` ; `members` contient des
 * sous-documents dont l'identifiant est `user`.
 */
async function canJoinHalaqa(userId, halaqaId) {
  if (!isObjectId(halaqaId)) return false;
  const Halaqa = model('Halaqa');
  if (!Halaqa) return false;

  const halaqa = await Halaqa.findById(halaqaId)
    .select('members admins creator owner createdBy').lean();
  if (!halaqa) return false;

  const uid = String(userId);
  if (String(halaqa.creator || halaqa.owner || halaqa.createdBy || '') === uid) return true;
  if ((halaqa.admins || []).some((a) => String(a) === uid)) return true;

  return (halaqa.members || []).some((m) => String(m?.user || m?.userId || m) === uid);
}

/**
 * L'utilisateur peut-il modérer la halaqa ?
 *
 * Le schéma nomme le propriétaire `creator` et tient une liste `admins`.
 * Les noms `owner` / `createdBy` sont conservés en repli pour les documents
 * plus anciens, mais ils ne sont pas ceux du modèle actuel — s'appuyer sur
 * eux seuls refusait l'accès au créateur lui-même.
 */
async function isHalaqaModerator(userId, halaqaId) {
  if (!isObjectId(halaqaId)) return false;
  const Halaqa = model('Halaqa');
  if (!Halaqa) return false;

  const halaqa = await Halaqa.findById(halaqaId)
    .select('members admins creator owner createdBy').lean();
  if (!halaqa) return false;

  const uid = String(userId);
  if (String(halaqa.creator || halaqa.owner || halaqa.createdBy || '') === uid) return true;
  if ((halaqa.admins || []).some((a) => String(a) === uid)) return true;

  return (halaqa.members || []).some(
    (m) => String(m?.user || m?.userId || m) === uid &&
      ['admin', 'moderator', 'teacher', 'creator'].includes(m?.role)
  );
}

/** L'utilisateur participe-t-il au khatam ? */
async function canJoinKhatam(userId, khatamId) {
  if (!isObjectId(khatamId)) return false;
  const Khatam = model('Khatam');
  if (!Khatam) return false;

  const khatam = await Khatam.findById(khatamId)
    .select('participants members owner createdBy halaqaId').lean();
  if (!khatam) return false;

  const uid = String(userId);
  if (String(khatam.owner || khatam.createdBy || '') === uid) return true;

  const roster = khatam.participants || khatam.members || [];
  if (roster.some((p) => String(p?.userId || p?.user || p) === uid)) return true;

  // Un khatam rattaché à une halaqa est ouvert aux membres de cette halaqa.
  if (khatam.halaqaId) return canJoinHalaqa(userId, khatam.halaqaId);

  return false;
}

/** L'utilisateur fait-il partie de la conversation ? */
async function canJoinConversation(userId, conversationId) {
  if (!isObjectId(conversationId)) return false;
  const Conversation = model('Conversation');
  if (!Conversation) return false;

  const conversation = await Conversation.findById(conversationId)
    .select('participants members').lean();
  if (!conversation) return false;

  const uid = String(userId);
  const roster = conversation.participants || conversation.members || [];
  return roster.some((p) => String(p?.userId || p?.user || p) === uid);
}

/** Salon d'appel `call:<a>:<b>` : réservé aux deux interlocuteurs. */
function canJoinCall(userId, roomId) {
  const parts = String(roomId).split(':');
  if (parts.length !== 3) return false;
  const uid = String(userId);
  return parts[1] === uid || parts[2] === uid;
}

/**
 * Point d'entrée unique. Retourne le nom canonique du salon si l'accès est
 * accordé, `null` sinon.
 */
async function resolveRoom(userId, rawRoomId) {
  if (!userId || !rawRoomId || typeof rawRoomId !== 'string') return null;

  const roomId = rawRoomId.trim();
  if (roomId.length > 128) return null;

  // Salon personnel de notifications : uniquement le sien.
  if (roomId.startsWith('notifications:')) {
    return roomId === `notifications:${userId}` ? roomId : null;
  }

  if (roomId.startsWith('halaqa:')) {
    const id = roomId.slice('halaqa:'.length);
    return (await canJoinHalaqa(userId, id)) ? roomId : null;
  }

  if (roomId.startsWith('khatam:')) {
    const id = roomId.slice('khatam:'.length);
    return (await canJoinKhatam(userId, id)) ? roomId : null;
  }

  if (roomId.startsWith('conversation:')) {
    const id = roomId.slice('conversation:'.length);
    return (await canJoinConversation(userId, id)) ? roomId : null;
  }

  if (roomId.startsWith('call:')) {
    return canJoinCall(userId, roomId) ? roomId : null;
  }

  // Un identifiant nu est interprété comme une conversation (compatibilité
  // avec le client actuel), sous réserve d'en être membre.
  if (isObjectId(roomId)) {
    return (await canJoinConversation(userId, roomId)) ? roomId : null;
  }

  return null;
}

module.exports = {
  resolveRoom,
  canJoinHalaqa,
  isHalaqaModerator,
  canJoinKhatam,
  isKhatamModerator,
  canJoinConversation,
  canJoinCall,
};
