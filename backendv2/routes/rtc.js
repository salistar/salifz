/**
 * Configuration WebRTC — Salifz
 *
 * Les clients (mobile et web) ne doivent pas embarquer les identifiants TURN
 * en dur : ils changent, et un identifiant compilé dans une application est
 * un identifiant public. Le serveur les distribue aux utilisateurs
 * authentifiés, à la demande.
 *
 * STUN permet à chaque pair de découvrir son adresse publique — cela suffit
 * pour la majorité des appels. TURN relaie le flux quand la connexion directe
 * échoue (NAT symétrique, réseau d'entreprise, certains opérateurs mobiles) :
 * sans lui, une partie des appels reste muette sans message d'erreur.
 */

const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const TURN_TTL_SECONDS = 12 * 3600;

/**
 * Identifiants TURN éphémères (mécanisme REST de coturn).
 *
 * Utilisé si `TURN_STATIC_SECRET` est fourni : le nom d'utilisateur porte sa
 * propre date d'expiration et le mot de passe en est dérivé. Un identifiant
 * qui fuite cesse de fonctionner de lui-même — contrairement à un mot de passe
 * fixe partagé par tous les clients.
 */
function ephemeralCredentials(secret, userId) {
  const expiry = Math.floor(Date.now() / 1000) + TURN_TTL_SECONDS;
  const username = `${expiry}:${userId}`;
  const credential = crypto
    .createHmac('sha1', secret)
    .update(username)
    .digest('base64');

  return { username, credential, expiresAt: expiry };
}

/**
 * GET /api/v1/rtc/ice-servers
 * Liste des serveurs ICE à passer à `new RTCPeerConnection({ iceServers })`.
 */
router.get('/ice-servers', (req, res) => {
  const {
    STUN_URL,
    TURN_URL,
    TURN_USER,
    TURN_PASSWORD,
    TURN_STATIC_SECRET,
    RTC_PUBLIC_HOST,
  } = process.env;

  /**
   * Les URL ICE sont consommées par un **navigateur ou un téléphone**, pas par
   * le conteneur. Un nom interne à Docker comme `host.docker.internal` ne
   * résout pas de leur côté : les candidats TURN échouaient en silence.
   *
   * On réécrit donc l'hôte avec `RTC_PUBLIC_HOST` si fourni, sinon avec celui
   * par lequel le client a joint l'API — c'est par définition une adresse
   * qu'il sait atteindre.
   */
  const publicHost =
    RTC_PUBLIC_HOST || String(req.headers.host || 'localhost').split(':')[0];

  const withPublicHost = (url) =>
    typeof url === 'string'
      ? url.replace(/(?<=^(?:stun|turn|turns):)[^:/?]+/, publicHost)
      : url;

  const iceServers = [];

  // Serveur STUN local en premier, repli public ensuite : si la pile locale
  // est arrêtée, les appels continuent de fonctionner en direct.
  iceServers.push({ urls: withPublicHost(STUN_URL || 'stun:localhost:3478') });
  iceServers.push({ urls: 'stun:stun.l.google.com:19302' });

  if (TURN_URL) {
    if (TURN_STATIC_SECRET) {
      const { username, credential, expiresAt } = ephemeralCredentials(
        TURN_STATIC_SECRET,
        String(req.userId)
      );
      iceServers.push({ urls: withPublicHost(TURN_URL), username, credential });
      return res.json({
        success: true,
        data: { iceServers, expiresAt, mode: 'ephemeral' },
      });
    }

    if (TURN_USER && TURN_PASSWORD) {
      iceServers.push({
        urls: withPublicHost(TURN_URL),
        username: TURN_USER,
        credential: TURN_PASSWORD,
      });
    }
  }

  res.json({
    success: true,
    data: {
      iceServers,
      mode: TURN_URL ? 'static' : 'stun-only',
      // Permet au client de prévenir l'utilisateur : sans TURN, un appel peut
      // échouer selon son réseau, et il vaut mieux le dire que le laisser
      // deviner.
      turnAvailable: Boolean(TURN_URL),
    },
  });
});

module.exports = router;
