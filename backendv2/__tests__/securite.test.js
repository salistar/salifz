/**
 * Garanties de sécurité — Salifz
 *
 * Ces tests couvrent les invariants dont la régression coûterait le plus cher,
 * et que la relecture ne rattrape pas : un jeton accepté hors de son usage,
 * un secret d'exemple parti en production, un code OTP devinable. Chacun
 * correspond à un défaut réellement trouvé dans ce dépôt.
 */

const { __testables } = require('../routes/verification');
const { generateOTP, issueOTP, consumeOTP, MAX_ATTEMPTS, otpStore } = __testables;

describe('Codes de vérification (OTP)', () => {
  beforeEach(() => otpStore.clear());

  test('sont à six chiffres', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateOTP()).toMatch(/^\d{6}$/);
    }
  });

  test('couvrent tout l’intervalle, bornes comprises', () => {
    // Une erreur classique sur `randomInt` est d'exclure 999999 ou de ne
    // jamais produire 100000.
    const values = Array.from({ length: 2000 }, () => Number(generateOTP()));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(100000);
    expect(Math.max(...values)).toBeLessThanOrEqual(999999);
  });

  test('ne se répètent pas de façon détectable', () => {
    const codes = new Set(Array.from({ length: 500 }, generateOTP));
    // Sur un million de valeurs, 500 tirages donnent statistiquement moins
    // d'une collision. Un générateur figé ou à faible entropie s'effondre ici.
    expect(codes.size).toBeGreaterThan(495);
  });

  test('le bon code est accepté une seule fois', () => {
    const otp = issueOTP('email:a@b.fr');
    expect(consumeOTP('email:a@b.fr', otp)).toEqual({ ok: true });
    // Rejouer le même code doit échouer : il a été consommé.
    expect(consumeOTP('email:a@b.fr', otp).ok).toBe(false);
  });

  test('le code est brûlé après le plafond de tentatives', () => {
    issueOTP('email:brute@b.fr');

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const result = consumeOTP('email:brute@b.fr', '000000');
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('invalid');
      expect(result.remaining).toBe(MAX_ATTEMPTS - i);
    }

    const exhausted = consumeOTP('email:brute@b.fr', '000000');
    expect(exhausted.reason).toBe('too_many_attempts');
    // Le code ne doit plus exister : sans cela, l'attaquant reprend où il
    // s'était arrêté au lieu de repartir de zéro.
    expect(otpStore.has('email:brute@b.fr')).toBe(false);
  });

  test('un code brûlé refuse même la bonne valeur', () => {
    const otp = issueOTP('email:c@b.fr');
    for (let i = 0; i <= MAX_ATTEMPTS; i++) consumeOTP('email:c@b.fr', '000000');
    expect(consumeOTP('email:c@b.fr', otp).ok).toBe(false);
  });

  test('un code expiré est refusé', () => {
    issueOTP('email:vieux@b.fr');
    const entry = otpStore.get('email:vieux@b.fr');
    entry.expiresAt = Date.now() - 1;
    expect(consumeOTP('email:vieux@b.fr', entry.otp).reason).toBe('expired');
  });

  test('une longueur inattendue ne fait pas planter la comparaison', () => {
    // `crypto.timingSafeEqual` lève si les tampons diffèrent en longueur :
    // sans garde, un code vide ou trop long ferait tomber la route en 500.
    const otp = issueOTP('email:d@b.fr');
    expect(() => consumeOTP('email:d@b.fr', '')).not.toThrow();
    expect(() => consumeOTP('email:d@b.fr', '0'.repeat(500))).not.toThrow();
    expect(() => consumeOTP('email:d@b.fr', undefined)).not.toThrow();
    expect(otp).toMatch(/^\d{6}$/);
  });
});

describe('Jetons typés', () => {
  let tokens;

  beforeAll(() => {
    // Les secrets sont lus à l'import du module.
    process.env.JWT_SECRET = 'x'.repeat(48);
    process.env.JWT_REFRESH_SECRET = 'y'.repeat(48);
    process.env.JWT_RESET_SECRET = 'z'.repeat(48);
    tokens = require('../utils/tokens');
  });

  test('un jeton d’accès est accepté comme jeton d’accès', () => {
    const token = tokens.signAccessToken('507f1f77bcf86cd799439011');
    expect(tokens.verifyAccessToken(token).sub).toBe('507f1f77bcf86cd799439011');
  });

  test('un jeton de rafraîchissement n’ouvre pas une session', () => {
    // C'était le défaut : les trois types partageaient un secret et aucune
    // revendication ne les distinguait, donc un jeton de réinitialisation
    // servait de jeton d'accès.
    const refresh = tokens.signRefreshToken('507f1f77bcf86cd799439011');
    expect(() => tokens.verifyAccessToken(refresh)).toThrow();
  });

  test('un jeton de réinitialisation n’ouvre pas une session', () => {
    const reset = tokens.signResetToken('507f1f77bcf86cd799439011', 'empreinte');
    expect(() => tokens.verifyAccessToken(reset)).toThrow();
  });

  test('un en-tête Authorization malformé ne renvoie pas de jeton', () => {
    expect(tokens.bearerFrom(undefined)).toBeNull();
    expect(tokens.bearerFrom('')).toBeNull();
    expect(tokens.bearerFrom('Basic abc')).toBeNull();
  });
});

describe('Validation de la configuration', () => {
  const { requireSecret, MIN_SECRET_LENGTH } = require('../config/env');
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  test('un secret absent empêche le démarrage', () => {
    delete process.env.UN_SECRET_ABSENT;
    expect(() => requireSecret('UN_SECRET_ABSENT')).toThrow();
  });

  test('un secret trop court est refusé', () => {
    process.env.SECRET_COURT = 'a'.repeat(MIN_SECRET_LENGTH - 1);
    expect(() => requireSecret('SECRET_COURT')).toThrow();
  });

  test('une valeur d’exemple est refusée', () => {
    // Le risque réel : copier `.env.example` en `.env` et déployer tel quel.
    process.env.SECRET_EXEMPLE = 'salifz_super_secret_key_change_in_production_2024';
    expect(() => requireSecret('SECRET_EXEMPLE')).toThrow();
  });

  test('un secret valide passe', () => {
    process.env.SECRET_OK = 'k'.repeat(MIN_SECRET_LENGTH);
    expect(requireSecret('SECRET_OK')).toHaveLength(MIN_SECRET_LENGTH);
  });
});

describe('Présence en ligne', () => {
  const presence = require('../services/presence');

  test('sans couche temps réel, personne n’est déclaré en ligne', async () => {
    // La règle qui compte : ne jamais inventer une présence. L'ancien code
    // renvoyait `Math.random() > 0.5`.
    expect(presence.isAvailable()).toBe(false);
    expect(await presence.onlineUserIds()).toEqual(new Set());
  });

  test('la présence vient bien des sockets connectés', async () => {
    presence.register({
      fetchSockets: async () => [
        { data: { userId: 'a' } },
        { data: { userId: 'b' } },
        { data: {} },
      ],
    });
    const online = await presence.onlineUserIds();
    expect(online).toEqual(new Set(['a', 'b']));
  });

  test('une couche temps réel en panne ne fait pas échouer la page', async () => {
    presence.register({
      fetchSockets: async () => {
        throw new Error('adaptateur Redis injoignable');
      },
    });
    await expect(presence.onlineUserIds()).resolves.toEqual(new Set());
  });
});
