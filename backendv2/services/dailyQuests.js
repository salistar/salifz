/**
 * Objectifs du jour — définition unique.
 *
 * La même liste existait en trois exemplaires : dans `routes/auth.js` (à la
 * création d'un compte), dans `routes/gamification.js` (à chaque nouvelle
 * journée) et, sous une autre forme, dans `models/Challenge.js`. Les trois
 * avaient déjà divergé : les identifiants ne correspondaient plus
 * (`daily_streak` d'un côté, `daily_lesson` de l'autre), et les récompenses
 * non plus. Un objectif validé sous un identifiant pouvait donc rester
 * introuvable sous l'autre.
 *
 * Les libellés sont localisés dans les trois langues du produit. Ils étaient
 * en anglais seulement, si bien qu'une interface française affichait
 * « Memorize 5 new verses ».
 */

/**
 * @param {object} user  Le compte concerné : l'objectif de mémorisation suit
 *                       la valeur choisie dans ses réglages, et une quête
 *                       supplémentaire s'ajoute pour les comptes payants.
 */
function genererQuetesDuJour(user = {}) {
  const objectifQuotidien = user?.profile?.dailyGoal ?? 5;

  const quetes = [
    {
      questId: 'daily_memorize',
      type: 'memorize',
      description: {
        ar: `احفظ ${objectifQuotidien} آيات جديدة اليوم`,
        en: `Memorize ${objectifQuotidien} new verses`,
        fr: `Mémoriser ${objectifQuotidien} nouveaux versets`,
      },
      target: objectifQuotidien,
      current: 0,
      xpReward: objectifQuotidien * 10,
      completed: false,
    },
    {
      questId: 'daily_review',
      type: 'review',
      description: {
        ar: 'راجع 10 آيات محفوظة',
        en: 'Review 10 verses',
        fr: 'Réviser 10 versets',
      },
      target: 10,
      current: 0,
      xpReward: 30,
      completed: false,
    },
    {
      questId: 'daily_lesson',
      type: 'streak',
      description: {
        ar: 'أكمل درساً اليوم',
        en: 'Complete a lesson',
        fr: 'Terminer une leçon',
      },
      target: 1,
      current: 0,
      xpReward: 20,
      completed: false,
    },
  ];

  // `isPremium` n'existe que sur un document Mongoose complet ; l'appel est
  // donc protégé, sans quoi générer des quêtes depuis un objet simple lève.
  if (typeof user?.isPremium === 'function' && user.isPremium()) {
    quetes.push({
      questId: 'daily_tajwid',
      type: 'tajwid',
      description: {
        ar: 'احصل على 80% أو أكثر في تمرين تجويد',
        en: 'Get 80%+ on a tajwid exercise',
        fr: 'Obtenir 80 % ou plus à un exercice de tajwid',
      },
      target: 1,
      current: 0,
      xpReward: 40,
      completed: false,
    });
  }

  return quetes;
}

module.exports = { genererQuetesDuJour };
