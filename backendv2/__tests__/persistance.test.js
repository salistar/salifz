/**
 * Persistance des documents — Salifz
 *
 * Ces tests existent à cause d'une classe de bug particulièrement discrète :
 * en mode strict, Mongoose **jette silencieusement** toute écriture vers un
 * chemin absent du schéma. Aucune exception, aucun avertissement — l'API
 * répond « enregistré » et la valeur a disparu au rechargement suivant.
 *
 * C'est exactement ce qui se passait pour `user.settings`, et ce qu'aucune
 * vérification de type ne peut détecter. La seule parade est un aller-retour
 * réel en base : écrire, relire depuis le disque, comparer.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

beforeAll(async () => {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await memoryServer?.stop();
});

describe('Réglages utilisateur', () => {
  const User = require('../models/User');

  async function nouvelUtilisateur(suffixe) {
    return User.create({
      email: `test${suffixe}@salifz.test`,
      password: 'MotDePasse2026',
      username: `test${suffixe}`,
      displayName: `Utilisateur ${suffixe}`,
    });
  }

  test('un réglage écrit est bien relu depuis la base', async () => {
    const user = await nouvelUtilisateur('a');

    user.set('settings.appearance.theme', 'dark');
    user.set('settings.audio.repeatCount', 7);
    user.set('settings.privacy.showOnLeaderboard', false);
    await user.save();

    // Relecture depuis la base, pas depuis l'objet en mémoire : c'est la
    // distinction que le bug d'origine exploitait.
    const relu = await User.findById(user._id).lean();
    expect(relu.settings.appearance.theme).toBe('dark');
    expect(relu.settings.audio.repeatCount).toBe(7);
    expect(relu.settings.privacy.showOnLeaderboard).toBe(false);
  });

  test('les valeurs par défaut du schéma sont appliquées', async () => {
    const user = await nouvelUtilisateur('b');
    const relu = await User.findById(user._id).lean();
    expect(relu.settings.appearance.theme).toBe('light');
    expect(relu.settings.learning.reviewMode).toBe('spaced');
  });

  test('une valeur hors énumération est rejetée, pas ignorée', async () => {
    const user = await nouvelUtilisateur('c');
    user.set('settings.appearance.theme', 'fluo');
    await expect(user.save()).rejects.toThrow();
  });

  test('une valeur hors bornes est rejetée', async () => {
    const user = await nouvelUtilisateur('d');
    user.set('settings.audio.repeatCount', 999);
    await expect(user.save()).rejects.toThrow();
  });

  test('un chemin absent du schéma n’est pas persisté', async () => {
    // Ce test documente le comportement qui a causé le bug : il ne lève pas,
    // il perd la donnée. Écrire vers un chemin non déclaré doit rester sans
    // effet — et donc passer par la table explicite de `routes/settings.js`.
    const user = await nouvelUtilisateur('e');
    user.set('settings.inventé.champ', 'valeur');
    await user.save();

    const relu = await User.findById(user._id).lean();
    expect(relu.settings.inventé).toBeUndefined();
  });
});

describe('Articles de boutique', () => {
  const { ShopItem } = require('../models/ShopItem');

  test('les libellés sont conservés dans les trois langues', async () => {
    // Le schéma ne déclarait pas `fr` : le français était accepté par l'API
    // puis silencieusement perdu, et la boutique s'affichait en anglais.
    await ShopItem.create({
      itemId: 'test_item',
      name: { ar: 'اختبار', en: 'Test', fr: 'Essai' },
      description: { ar: 'وصف', en: 'Description', fr: 'Description' },
      icon: '🧪',
      category: 'powerup',
      price: 10,
      effect: { type: 'hint', value: 1 },
    });

    const relu = await ShopItem.findOne({ itemId: 'test_item' }).lean();
    expect(relu.name.fr).toBe('Essai');
    expect(relu.name.ar).toBe('اختبار');
    expect(relu.name.en).toBe('Test');
  });

  test('un effet non numérique est conservé', async () => {
    // `effect.value` était déclaré `Number` : les effets cosmétiques, dont la
    // valeur est un identifiant de variante, étaient perdus.
    await ShopItem.create({
      itemId: 'test_theme',
      name: { ar: 'مظهر', en: 'Theme', fr: 'Thème' },
      description: { ar: 'وصف', en: 'A theme', fr: 'Un thème' },
      icon: '🌙',
      category: 'cosmetic',
      price: 100,
      effect: { type: 'theme', variant: 'night' },
    });

    const relu = await ShopItem.findOne({ itemId: 'test_theme' }).lean();
    expect(relu.effect.variant).toBe('night');
  });
});

describe('Historique de série', () => {
  const Streak = require('../models/Streak');

  test('l’historique conserve ce que les analyses lisent', async () => {
    // `routes/analytics.js` et `routes/parental.js` dépendent entièrement de
    // ces quatre champs : s'ils changent de nom, les écrans repassent à zéro
    // sans erreur visible.
    const userId = new mongoose.Types.ObjectId();
    await Streak.create({
      user: userId,
      current: 2,
      history: [{ date: new Date(), completed: true, xpEarned: 40, versesMemorized: 3, versesReviewed: 5 }],
    });

    const relu = await Streak.findOne({ user: userId }).lean();
    const jour = relu.history[0];
    expect(jour.completed).toBe(true);
    expect(jour.xpEarned).toBe(40);
    expect(jour.versesMemorized).toBe(3);
    expect(jour.versesReviewed).toBe(5);
  });
});
