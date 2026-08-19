/**
 * Noms des mois hégiriens.
 *
 * `Intl` sait convertir une date grégorienne vers le calendrier
 * `islamic-umalqura`, mais il ne sait pas nommer les mois en français : il
 * renvoie « 6 rabia al awal 1448 AH », c'est-à-dire une translittération
 * approximative suivie d'une abréviation latine — dans une interface
 * française, au-dessus d'un salut en arabe. L'anglais n'est pas mieux servi
 * (« Rabiʻ I 6, 1448 AH »).
 *
 * Les noms sont donc fournis ici. Ils sont stables — ce sont les mois du
 * calendrier, pas des chaînes d'interface qui bougeraient avec le produit —
 * et vivent à côté de la couche i18n plutôt que dans un namespace JSON, où
 * ils seraient traités comme du texte modifiable.
 *
 * L'arabe garde le rendu natif d'`Intl` : `ar-SA` nomme correctement ses
 * propres mois et écrit l'année en chiffres arabes.
 */

export const MOIS_HEGIRIENS: Record<string, string[]> = {
  fr: [
    'mouharram',
    'safar',
    'rabia al-awwal',
    'rabia ath-thani',
    'joumada al-oula',
    'joumada ath-thania',
    'rajab',
    'chaabane',
    'ramadan',
    'chawwal',
    'dhou al-qida',
    'dhou al-hijja',
  ],
  en: [
    'Muharram',
    'Safar',
    'Rabi al-awwal',
    'Rabi ath-thani',
    'Jumada al-ula',
    'Jumada ath-thaniya',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    "Dhu al-Qi'dah",
    'Dhu al-Hijjah',
  ],
};

/** Suffixe d'ère. « AH » (anno Hegirae) est latin et se lit en anglais ; le
 *  français dit « de l'hégire ». */
export const ERE_HEGIRIENNE: Record<string, string> = {
  fr: 'de l’hégire',
  en: 'AH',
};
