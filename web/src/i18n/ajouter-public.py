# -*- coding: utf-8 -*-
"""Cles du lot Public : landing, confidentialite, authentification.

La page de presentation est le seul ecran que voit quelqu'un qui ne connait pas
encore le produit. C'est aussi celui ou une phrase francaise au milieu d'une
page arabe coute le plus cher, d'ou la meme regle qu'ailleurs : les trois
langues ou rien.
"""
import io
import json
import os
import sys

LOTS = {
    'landing': {
        'fr': {
            'featuresTitle': u"Ce que l'application fait aujourd'hui",
            'featuresLead': u"Chaque point ci-dessous est en service — rien n'y est annonce pour plus tard.",
            'methodTitle': u"Quatre gestes, repetes",
            'methodLead': u"La memorisation ne tient pas a un outil mais a un cycle. L'application se contente de le rendre regulier.",
            'pricingTitle': u"Le Coran d'abord",
            'pricingLead': u"La lecture, la memorisation et la revision ne sont pas derriere un paiement, et ne le seront pas.",

            'f1Title': u"Mushaf avec masquage progressif",
            'f1Body': u"Les 604 pages, ligne a ligne. Quatre niveaux de masquage — texte complet, premier mot de chaque ligne, premieres lettres, puis rien — pour passer de la lecture au rappel sans changer d'ecran.",
            'f2Title': u"Mot a mot",
            'f2Body': u"Un appui long sur un mot en donne la traduction et la prononciation, avec l'audio du mot isole. Utile quand un verset bloque sur un terme precis.",
            'f3Title': u"Revision espacee",
            'f3Body': u"Les versets reviennent quand vous etes sur le point de les oublier, pas dans l'ordre du Coran. La file de revision se construit a partir de vos reponses passees.",
            'f4Title': u"Halaqat",
            'f4Body': u"Un groupe, une discussion en temps reel, des appels audio et video. L'enseignant ecoute une recitation envoyee et la valide ou la renvoie avec un commentaire.",
            'f5Title': u"Khatam collaboratif",
            'f5Body': u"Les 60 hizb repartis entre les membres : le groupe acheve une lecture complete que personne n'aurait finie seul.",
            'f6Title': u"Heures de priere et qibla",
            'f6Body': u"Calculees depuis votre position, avec la direction et la distance vers La Mecque. Quand le magnetometre manque, l'application le dit au lieu de faire semblant.",

            's1Title': u"Ecouter avant de memoriser",
            's1Body': u"Le verset est joue par le recitateur de votre choix. L'oreille prend l'empreinte du rythme avant que l'oeil ne travaille.",
            's2Title': u"Masquer par degres",
            's2Body': u"Le texte disparait progressivement. Chaque niveau retire un appui, jusqu'a ce qu'il n'en reste aucun.",
            's3Title': u"Revenir au bon moment",
            's3Body': u"Ce que vous recitez sans hesiter revient plus tard ; ce qui accroche revient vite. C'est le principe de la repetition espacee.",
            's4Title': u"Faire valider",
            's4Body': u"Un enregistrement envoye a votre enseignant, ecoute, puis valide ou commente. La correction vient d'une personne, pas d'un score automatique.",

            'planFree': u"Gratuit",
            'planPlus': u"Salifz+",
            'planFamily': u"Famille",
            'comingSoon': u"a venir",
            'free1': u"Le mushaf complet, 604 pages",
            'free2': u"Masquage progressif et mot a mot",
            'free3': u"Revision espacee",
            'free4': u"Heures de priere et qibla",
            'free5': u"Rejoindre une halaqa",
            'plus1': u"Audio hors ligne par sourate",
            'plus2': u"Statistiques detaillees",
            'plus3': u"Themes et avatars",
            'plus4': u"Creation de halaqat sans limite",
            'plusNote': u"Les offres passeront par l'App Store et Google Play. Aucun paiement n'est actif pour l'instant.",
            'family1': u"Jusqu'a cinq comptes enfants",
            'family2': u"Suivi d'activite reel, jour par jour",
            'family3': u"Limites de temps et restrictions",
            'familyNote': u"Le tableau de bord parental n'affiche que des donnees mesurees.",

            'ctaTitle': u"Commencez par une sourate",
            'ctaBody': u"Al-Fatiha fait sept versets. C'est assez pour voir si la methode vous convient.",
        },
        'en': {
            'featuresTitle': u"What the app does today",
            'featuresLead': u"Every point below is live — nothing here is announced for later.",
            'methodTitle': u"Four gestures, repeated",
            'methodLead': u"Memorisation rests on a cycle, not a tool. The app only keeps that cycle regular.",
            'pricingTitle': u"The Quran first",
            'pricingLead': u"Reading, memorising and reviewing are not behind a paywall, and never will be.",

            'f1Title': u"Mushaf with progressive masking",
            'f1Body': u"All 604 pages, line by line. Four masking levels — full text, first word of each line, first letters, then nothing — moving from reading to recall without changing screen.",
            'f2Title': u"Word by word",
            'f2Body': u"A long press on a word gives its translation and pronunciation, with audio of the isolated word. Useful when a verse catches on one term.",
            'f3Title': u"Spaced review",
            'f3Body': u"Verses return when you are about to forget them, not in Quranic order. The review queue is built from your past answers.",
            'f4Title': u"Halaqat",
            'f4Body': u"A group, live discussion, audio and video calls. The teacher listens to a submitted recitation and either approves it or returns it with a comment.",
            'f5Title': u"Collaborative khatam",
            'f5Body': u"The 60 hizb split across members: the group completes a full reading that nobody would have finished alone.",
            'f6Title': u"Prayer times and qibla",
            'f6Body': u"Computed from your position, with direction and distance to Mecca. When the magnetometer is missing, the app says so instead of pretending.",

            's1Title': u"Listen before memorising",
            's1Body': u"The verse is recited by the reciter you choose. The ear takes the imprint of the rhythm before the eye starts working.",
            's2Title': u"Mask by degrees",
            's2Body': u"The text fades progressively. Each level removes one support, until none is left.",
            's3Title': u"Return at the right moment",
            's3Body': u"What you recite without hesitation comes back later; what catches comes back soon. That is spaced repetition.",
            's4Title': u"Have it checked",
            's4Body': u"A recording sent to your teacher, listened to, then approved or commented. Correction comes from a person, not an automatic score.",

            'planFree': u"Free",
            'planPlus': u"Salifz+",
            'planFamily': u"Family",
            'comingSoon': u"coming",
            'free1': u"The complete mushaf, 604 pages",
            'free2': u"Progressive masking and word by word",
            'free3': u"Spaced review",
            'free4': u"Prayer times and qibla",
            'free5': u"Join a halaqa",
            'plus1': u"Offline audio by surah",
            'plus2': u"Detailed statistics",
            'plus3': u"Themes and avatars",
            'plus4': u"Unlimited halaqa creation",
            'plusNote': u"Plans will go through the App Store and Google Play. No payment is active for now.",
            'family1': u"Up to five child accounts",
            'family2': u"Real activity tracking, day by day",
            'family3': u"Time limits and restrictions",
            'familyNote': u"The parental dashboard shows measured data only.",

            'ctaTitle': u"Start with one surah",
            'ctaBody': u"Al-Fatiha is seven verses. That is enough to see whether the method suits you.",
        },
        'ar': {
            'featuresTitle': u"ما يفعله التطبيق اليوم",
            'featuresLead': u"كل نقطة أدناه تعمل الآن — لا شيء هنا موعود لاحقًا.",
            'methodTitle': u"أربع خطوات، تتكرر",
            'methodLead': u"الحفظ يقوم على دورة لا على أداة. والتطبيق يكتفي بجعل هذه الدورة منتظمة.",
            'pricingTitle': u"القرآن أولًا",
            'pricingLead': u"القراءة والحفظ والمراجعة ليست خلف دفع، ولن تكون.",

            'f1Title': u"المصحف مع الإخفاء التدريجي",
            'f1Body': u"الصفحات الـ604 كاملة، سطرًا سطرًا. أربعة مستويات للإخفاء — النص كاملًا، أول كلمة من كل سطر، الحروف الأولى، ثم لا شيء — للانتقال من القراءة إلى الاستذكار دون تغيير الشاشة.",
            'f2Title': u"كلمة بكلمة",
            'f2Body': u"الضغط المطوّل على كلمة يعطي ترجمتها ونطقها، مع صوت الكلمة منفردة. مفيد حين تتعثر آية عند لفظ بعينه.",
            'f3Title': u"مراجعة متباعدة",
            'f3Body': u"تعود الآيات حين تكون على وشك نسيانها، لا بترتيب المصحف. تُبنى قائمة المراجعة من إجاباتك السابقة.",
            'f4Title': u"الحلقات",
            'f4Body': u"مجموعة، ونقاش مباشر، ومكالمات صوتية ومرئية. يستمع المعلم إلى التلاوة المرسلة فيعتمدها أو يعيدها مع ملاحظة.",
            'f5Title': u"ختمة جماعية",
            'f5Body': u"الأحزاب الستون موزعة على الأعضاء: تُتم المجموعة ختمة كاملة ما كان أحد ليتمها وحده.",
            'f6Title': u"مواقيت الصلاة والقبلة",
            'f6Body': u"تُحسب من موقعك، مع الاتجاه والمسافة إلى مكة. وحين يغيب مستشعر المغناطيسية يقول التطبيق ذلك بدل التظاهر.",

            's1Title': u"الاستماع قبل الحفظ",
            's1Body': u"تُتلى الآية بصوت القارئ الذي تختاره. تأخذ الأذن أثر الإيقاع قبل أن تعمل العين.",
            's2Title': u"الإخفاء على درجات",
            's2Body': u"يختفي النص تدريجيًا. كل مستوى يزيل سندًا، حتى لا يبقى منها شيء.",
            's3Title': u"العودة في الوقت المناسب",
            's3Body': u"ما تتلوه دون تردد يعود لاحقًا؛ وما يتعثر يعود سريعًا. هذا هو مبدأ التكرار المتباعد.",
            's4Title': u"عرضها للاعتماد",
            's4Body': u"تسجيل يُرسل إلى معلمك، يُستمع إليه، ثم يُعتمد أو يُعلَّق عليه. التصحيح من إنسان، لا من درجة آلية.",

            'planFree': u"مجاني",
            'planPlus': u"‎Salifz+‎",
            'planFamily': u"عائلي",
            'comingSoon': u"قريبًا",
            'free1': u"المصحف كاملًا، 604 صفحات",
            'free2': u"الإخفاء التدريجي وكلمة بكلمة",
            'free3': u"مراجعة متباعدة",
            'free4': u"مواقيت الصلاة والقبلة",
            'free5': u"الانضمام إلى حلقة",
            'plus1': u"صوت دون اتصال لكل سورة",
            'plus2': u"إحصاءات مفصلة",
            'plus3': u"سمات وصور رمزية",
            'plus4': u"إنشاء حلقات بلا حد",
            'plusNote': u"ستمر الخطط عبر App Store وGoogle Play. لا يوجد دفع مُفعَّل حاليًا.",
            'family1': u"حتى خمسة حسابات أطفال",
            'family2': u"متابعة نشاط حقيقية، يومًا بيوم",
            'family3': u"حدود زمنية وقيود",
            'familyNote': u"لوحة الوالدين لا تعرض إلا بيانات مقيسة.",

            'ctaTitle': u"ابدأ بسورة واحدة",
            'ctaBody': u"الفاتحة سبع آيات. وهذا يكفي لترى إن كانت الطريقة تناسبك.",
        },
    },
    'privacy': {
        'fr': {
            'children': u"Comptes enfants",
            'childrenCreated': u"Un compte enfant est cree par un parent, depuis un compte famille.",
            'childrenReport': u"Le rapport d'activite affiche au parent ne contient que des donnees mesurees : jours actifs, versets, XP.",
            'childrenRestricted': u"La discussion et les appels video y sont restreints par defaut.",
            'sourcesIp': u"Ces services recoivent l'adresse IP de votre appareil au moment ou vous chargez un verset ou un audio, comme pour toute requete web.",
            'selfHosted': u"Cette instance est hebergee par la personne qui l'a deployee. Sur une installation locale, vos donnees ne quittent pas votre machine.",
        },
        'en': {
            'children': u"Child accounts",
            'childrenCreated': u"A child account is created by a parent, from a family account.",
            'childrenReport': u"The activity report shown to the parent contains measured data only: active days, verses, XP.",
            'childrenRestricted': u"Chat and video calls are restricted there by default.",
            'sourcesIp': u"These services receive your device's IP address when you load a verse or an audio file, as with any web request.",
            'selfHosted': u"This instance is hosted by whoever deployed it. On a local install, your data never leaves your machine.",
        },
        'ar': {
            'children': u"حسابات الأطفال",
            'childrenCreated': u"يُنشئ الوالد حساب الطفل من حساب عائلي.",
            'childrenReport': u"تقرير النشاط المعروض على الوالد لا يتضمن إلا بيانات مقيسة: الأيام النشطة والآيات والنقاط.",
            'childrenRestricted': u"المحادثة والمكالمات المرئية مقيدة فيه افتراضيًا.",
            'sourcesIp': u"تتلقى هذه الخدمات عنوان IP لجهازك عند تحميل آية أو ملف صوتي، شأنها شأن أي طلب على الويب.",
            'selfHosted': u"تستضيف هذه النسخة الجهة التي نشرتها. وفي التثبيت المحلي لا تغادر بياناتك جهازك.",
        },
    },
    'auth': {
        'fr': {
            'signUpSide': u"Commencez par Al-Fatiha — sept versets suffisent a voir si la methode vous convient.",
            'forgotSide': u"Le lien recu expire rapidement et ne sert qu'une fois.",
            'checkSpam': u"Pensez a verifier les indesirables.",
            'createIt': u"Creer le compte",
        },
        'en': {
            'signUpSide': u"Start with Al-Fatiha — seven verses are enough to see whether the method suits you.",
            'forgotSide': u"The link you receive expires quickly and works only once.",
            'checkSpam': u"Remember to check your spam folder.",
            'createIt': u"Create the account",
        },
        'ar': {
            'signUpSide': u"ابدأ بالفاتحة — سبع آيات تكفي لترى إن كانت الطريقة تناسبك.",
            'forgotSide': u"الرابط الذي تتلقاه ينتهي سريعًا ولا يصلح إلا مرة واحدة.",
            'checkSpam': u"تذكّر التحقق من مجلد الرسائل غير المرغوبة.",
            'createIt': u"إنشاء الحساب",
        },
    },
}


def main():
    for ns, langues in LOTS.items():
        base = set(langues['fr'])
        for lg, d in langues.items():
            if set(d) != base:
                sys.exit(u"cles divergentes : %s / %s -> %s" % (ns, lg, base ^ set(d)))

        for lg, ajout in langues.items():
            chemin = os.path.join('locales', lg, ns + '.json')
            with io.open(chemin, encoding='utf-8') as f:
                data = json.load(f)
            data.update(ajout)
            with io.open(chemin, 'w', encoding='utf-8') as f:
                f.write(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True))
                f.write(u'\n')

        print(u'%-12s : %d cles ajoutees dans fr, en et ar' % (ns, len(base)))


if __name__ == '__main__':
    main()
