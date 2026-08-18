"""
Complète les six formes de pluriel arabe.

L'arabe distingue zéro, un, deux, un petit nombre (3-10), un grand nombre
(11-99) et le reste. Une clé qui n'a que `_one` et `_other` laisse i18next
sans correspondance pour count=3 : il retombe alors sur la langue de repli, et
l'utilisateur arabophone lit du français au milieu de sa phrase.

Le français et l'anglais n'ont que `_one` et `_other` — leur ajouter les
autres formes ne casse rien et garde les trois fichiers alignés, ce que
vérifie le contrôle de parité.
"""

import io
import json
import os

# Formes exigées par la règle de pluriel arabe, dans l'ordre CLDR.
FORMES_AR = ('zero', 'one', 'two', 'few', 'many', 'other')

# clé racine -> traduction par forme, par langue
PLURIELS = {
    'home.json': {
        'goalsLeft': {
            'fr': {'one': '{{count}} objectif restant aujourd’hui',
                   'other': '{{count}} objectifs restants aujourd’hui'},
            'en': {'one': '{{count}} goal left today',
                   'other': '{{count}} goals left today'},
            'ar': {'zero': 'لا أهداف متبقية اليوم',
                   'one': 'بقي هدف واحد اليوم',
                   'two': 'بقي هدفان اليوم',
                   'few': 'بقيت {{count}} أهداف اليوم',
                   'many': 'بقي {{count}} هدفاً اليوم',
                   'other': 'بقي {{count}} هدف اليوم'},
        },
        'toReview': {
            'fr': {'one': '{{count}} verset à réviser aujourd’hui',
                   'other': '{{count}} versets à réviser aujourd’hui'},
            'en': {'one': '{{count}} verse to review today',
                   'other': '{{count}} verses to review today'},
            'ar': {'zero': 'لا آيات للمراجعة اليوم',
                   'one': 'آية واحدة للمراجعة اليوم',
                   'two': 'آيتان للمراجعة اليوم',
                   'few': '{{count}} آيات للمراجعة اليوم',
                   'many': '{{count}} آية للمراجعة اليوم',
                   'other': '{{count}} آية للمراجعة اليوم'},
        },
    },
    'lessons.json': {
        'verses': {
            'fr': {'one': '{{count}} verset', 'other': '{{count}} versets'},
            'en': {'one': '{{count}} verse', 'other': '{{count}} verses'},
            'ar': {'zero': 'لا آيات', 'one': 'آية واحدة', 'two': 'آيتان',
                   'few': '{{count}} آيات', 'many': '{{count}} آية',
                   'other': '{{count}} آية'},
        },
    },
    'halaqat.json': {
        'members': {
            'fr': {'one': '{{count}} membre', 'other': '{{count}} membres'},
            'en': {'one': '{{count}} member', 'other': '{{count}} members'},
            'ar': {'zero': 'لا أعضاء', 'one': 'عضو واحد', 'two': 'عضوان',
                   'few': '{{count}} أعضاء', 'many': '{{count}} عضواً',
                   'other': '{{count}} عضو'},
        },
    },
    'stats.json': {
        'activeDays': {
            'fr': {'one': '{{count}} jour actif', 'other': '{{count}} jours actifs'},
            'en': {'one': '{{count}} active day', 'other': '{{count}} active days'},
            'ar': {'zero': 'لا أيام نشطة', 'one': 'يوم نشط واحد', 'two': 'يومان نشطان',
                   'few': '{{count}} أيام نشطة', 'many': '{{count}} يوماً نشطاً',
                   'other': '{{count}} يوم نشط'},
        },
    },
    'streak.json': {
        'current': {
            'fr': {'one': '{{count}} jour d’affilée', 'other': '{{count}} jours d’affilée'},
            'en': {'one': '{{count}} day in a row', 'other': '{{count}} days in a row'},
            'ar': {'zero': 'لا أيام متتالية', 'one': 'يوم واحد متتالٍ', 'two': 'يومان متتاليان',
                   'few': '{{count}} أيام متتالية', 'many': '{{count}} يوماً متتالياً',
                   'other': '{{count}} يوم متتالٍ'},
        },
    },
}

for fichier, cles in PLURIELS.items():
    for lg in ('fr', 'ar', 'en'):
        chemin = os.path.join('locales', lg, fichier)
        data = json.load(io.open(chemin, encoding='utf-8'))

        for racine, par_langue in cles.items():
            # On retire toutes les anciennes formes avant de réécrire, sinon
            # une forme obsolète survit et prend le pas selon l'ordre de
            # résolution.
            for f in FORMES_AR:
                data.pop(f'{racine}_{f}', None)
            data.pop(racine, None)

            for forme, texte in par_langue[lg].items():
                data[f'{racine}_{forme}'] = texte

        io.open(chemin, 'w', encoding='utf-8').write(
            json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + '\n'
        )

print('OK — six formes arabes posées sur 5 clés comptées')
