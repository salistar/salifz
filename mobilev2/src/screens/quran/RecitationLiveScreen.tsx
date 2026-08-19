/**
 * Récitation suivie — Salifz
 *
 * L'utilisateur récite un verset, le serveur transcrit et compare : chaque mot
 * ressort juste, approximatif, erroné ou oublié.
 *
 * **Ce n'est pas une note de tajwid.** L'écran dit quels mots ont été
 * prononcés, jamais comment. Confondre les deux répéterait la faute que
 * l'audit avait relevée sur l'ancienne analyse, qui rendait un score tiré au
 * hasard.
 *
 * Deux principes tiennent tout le reste :
 *
 * 1. « Je n'ai pas bien entendu » et « tu t'es trompé » ne se ressemblent pas
 *    à l'écran. Quand le moteur doute de lui-même, aucun mot n'est marqué en
 *    faute — le doute lui appartient, pas au récitant.
 * 2. Le bouton n'existe pas si le moteur n'est pas joignable. Offrir un
 *    enregistrement qui échouera est pire que de ne rien offrir.
 *
 * ## Deux modes, et pourquoi
 *
 * **Verdict** — un seul enregistrement, du début à la fin, puis le bilan
 * complet avec les fautes. C'est le mode de référence.
 *
 * **Suivi** — des extraits successifs pendant la récitation, le surlignage
 * avance au fur et à mesure. Couper et relancer l'enregistrement laisse un
 * trou de quelques centaines de millisecondes, qui peut hacher un mot : ce
 * mode n'affiche donc **que les mots reconnus**, et ne marque jamais rien en
 * faute. Un mot haché par une couture n'avance simplement pas le curseur, et
 * l'extrait suivant le rattrape. Le jugement reste au mode verdict, qui tient
 * l'enregistrement entier.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

import { recitationLiveAPI } from '../../services/api';
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[RecitationLive]';

/**
 * Durée d'un extrait en mode suivi.
 *
 * Le modèle transcrit à 0,8× le temps réel : six secondes d'audio reviennent
 * en cinq environ. Plus court multiplierait les coutures — donc les mots
 * hachés — pour un gain de réactivité que le temps de transcription annule.
 */
const DUREE_EXTRAIT_MS = 6000;

type EtatMot = 'juste' | 'approximatif' | 'errone' | 'oublie' | 'en_attente';
type Mode = 'verdict' | 'suivi';

interface MotSuivi {
  index: number;
  attendu: string;
  entendu: string | null;
  etat: EtatMot;
  similarite: number;
}

interface Resultat {
  mots: MotSuivi[];
  position: number;
  total: number;
  exactitude: number | null;
  confiance: number | null;
  fiable: boolean;
  silence: boolean;
  termine: boolean;
}

type Phase = 'verification' | 'indisponible' | 'pret' | 'enregistrement' | 'analyse' | 'resultat';

export default function RecitationLiveScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const surahNumber = Number(route?.params?.surahNumber) || 1;
  const ayahNumber = Number(route?.params?.ayahNumber) || 1;
  const texteVerset: string = route?.params?.verseText || '';

  const [phase, setPhase] = useState<Phase>('verification');
  const [mode, setMode] = useState<Mode>('verdict');
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // Mots validés au fil du suivi, cumulés d'un extrait à l'autre.
  const [acquis, setAcquis] = useState<Record<number, EtatMot>>({});

  const enregistrement = useRef<Audio.Recording | null>(null);
  const actif = useRef(false);
  // Position lue par la boucle d'extraits : un état React n'y serait pas à jour,
  // la boucle capturant la valeur du rendu où elle a démarré.
  const position = useRef(0);

  const motsDuVerset: MotSuivi[] = texteVerset
    .split(/\s+/)
    .filter(Boolean)
    .map((mot, index) => ({
      index,
      attendu: mot,
      entendu: null,
      etat: 'en_attente' as EtatMot,
      similarite: 0,
    }));

  // En mode verdict, l'affichage vient du résultat. En mode suivi, il vient du
  // cumul : le dernier extrait ne connaît que sa propre portion du verset.
  const mots: MotSuivi[] =
    mode === 'suivi'
      ? motsDuVerset.map((mot) => ({ ...mot, etat: acquis[mot.index] || 'en_attente' }))
      : resultat?.mots?.length
      ? resultat.mots
      : motsDuVerset;

  /** Le moteur répond-il ? Sinon l'écran le dit au lieu d'offrir un bouton mort. */
  useEffect(() => {
    let vivant = true;

    (async () => {
      try {
        const reponse: any = await recitationLiveAPI.etat();
        const donnees = reponse?.data?.data ?? reponse?.data ?? reponse;
        if (!vivant) return;
        setPhase(donnees?.disponible ? 'pret' : 'indisponible');
      } catch (e: any) {
        console.error(`${LOG_PREFIX} ❌ état`, e?.message);
        if (vivant) setPhase('indisponible');
      }
    })();

    return () => {
      vivant = false;
    };
  }, []);

  // Un enregistrement laissé ouvert garde le micro et la sortie audio : sur
  // Android, la lecture du Coran reste muette jusqu'au redémarrage de l'app.
  useEffect(() => {
    return () => {
      actif.current = false;
      enregistrement.current?.stopAndUnloadAsync().catch(() => {});
      enregistrement.current = null;
    };
  }, []);

  const preparerMicro = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      setMessage(t('recitationLive.microRefuse') || "L'accès au micro a été refusé.");
      return false;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    return true;
  };

  const nouvelEnregistrement = async () => {
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    return recording;
  };

  const envoyer = async (uri: string, partiel: boolean, depuis: number) => {
    const form = new FormData();
    form.append('audio', {
      uri,
      // Le serveur passe par ffmpeg, qui reconnaît le conteneur tout seul ;
      // le type déclaré ne sert qu'à satisfaire multer.
      name: 'recitation.m4a',
      type: 'audio/m4a',
    } as any);
    form.append('surahNumber', String(surahNumber));
    form.append('ayahNumber', String(ayahNumber));
    form.append('partiel', partiel ? 'true' : 'false');
    form.append('depuis', String(depuis));

    const reponse: any = await recitationLiveAPI.suivre(form, partiel);
    return (reponse?.data?.data ?? reponse?.data ?? reponse) as Resultat;
  };

  /**
   * Boucle d'extraits du mode suivi.
   *
   * L'envoi n'est pas attendu : la récitation continue pendant que l'extrait
   * précédent voyage. Attendre la réponse ajouterait le temps réseau au trou
   * entre deux enregistrements, et c'est ce trou qui hache les mots.
   */
  const boucleExtraits = useCallback(async () => {
    while (actif.current) {
      await new Promise((resoudre) => setTimeout(resoudre, DUREE_EXTRAIT_MS));
      if (!actif.current) return;

      const precedent = enregistrement.current;
      if (!precedent) return;

      try {
        await precedent.stopAndUnloadAsync();
        const uri = precedent.getURI();
        enregistrement.current = actif.current ? await nouvelEnregistrement() : null;

        if (!uri) continue;

        const depuis = position.current;
        envoyer(uri, true, depuis)
          .then((donnees) => {
            if (!actif.current || donnees.silence || !donnees.fiable) return;
            appliquerProgres(donnees);
          })
          .catch((e: any) => {
            // Un extrait perdu n'interrompt pas la récitation : le suivant
            // repart de la même position et rattrapera.
            console.warn(`${LOG_PREFIX} extrait ignoré`, e?.message);
          });
      } catch (e: any) {
        console.error(`${LOG_PREFIX} ❌ boucle`, e?.message);
        return;
      }
    }
  }, [surahNumber, ayahNumber]);

  /**
   * Cumule les mots reconnus.
   *
   * Seuls les états positifs sont retenus : en direct, un mot manquant veut
   * dire « pas encore entendu », pas « raté ». Le distinguer demanderait
   * l'enregistrement entier, que ce mode n'a pas.
   */
  const appliquerProgres = (donnees: Resultat) => {
    setAcquis((precedent) => {
      const suivant = { ...precedent };
      for (const mot of donnees.mots) {
        if (mot.etat === 'juste' || mot.etat === 'approximatif') {
          suivant[mot.index] = mot.etat;
        }
      }
      return suivant;
    });
    if (donnees.position > position.current) {
      position.current = donnees.position;
    }
  };

  const demarrer = useCallback(async () => {
    try {
      if (!(await preparerMicro())) return;

      setResultat(null);
      setMessage(null);
      setAcquis({});
      position.current = 0;

      enregistrement.current = await nouvelEnregistrement();
      actif.current = true;
      setPhase('enregistrement');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (mode === 'suivi') {
        boucleExtraits();
      }
    } catch (e: any) {
      console.error(`${LOG_PREFIX} ❌ démarrage`, e?.message);
      setMessage(t('recitationLive.erreurMicro') || "L'enregistrement n'a pas pu démarrer.");
      setPhase('pret');
    }
  }, [mode, boucleExtraits]);

  const arreter = useCallback(async () => {
    actif.current = false;
    const enCours = enregistrement.current;
    if (!enCours) return;

    setPhase('analyse');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await enCours.stopAndUnloadAsync();
      const uri = enCours.getURI();
      enregistrement.current = null;

      if (!uri) {
        setMessage(t('recitationLive.erreurMicro') || "L'enregistrement est vide.");
        setPhase('pret');
        return;
      }

      // Le dernier extrait du suivi porte le verdict de ce qu'il couvre ; en
      // mode verdict, l'enregistrement entier part d'un coup.
      const donnees = await envoyer(uri, false, mode === 'suivi' ? position.current : 0);

      if (mode === 'suivi') {
        appliquerProgres(donnees);
      }
      setResultat(donnees);
      setPhase('resultat');
      setMessage(interpreter(donnees));
    } catch (e: any) {
      console.error(`${LOG_PREFIX} ❌ analyse`, e?.message);
      const code = e?.response?.data?.code;
      if (code === 'RECITATION_MOTEUR_INDISPONIBLE') {
        setPhase('indisponible');
        return;
      }
      setMessage(
        code === 'RECITATION_AUDIO_INVALIDE'
          ? t('recitationLive.audioInvalide') || "L'extrait n'a pas pu être lu."
          : t('recitationLive.erreurAnalyse') || "L'analyse n'a pas abouti. Réessaie."
      );
      setPhase('pret');
    }
  }, [mode, surahNumber, ayahNumber]);

  /**
   * Traduit le résultat en une phrase.
   *
   * L'ordre compte : le silence et le doute passent **avant** l'exactitude.
   * Annoncer « 0 % » à quelqu'un dont le micro n'a rien capté serait un
   * reproche adressé à une panne.
   */
  const interpreter = (donnees: Resultat): string | null => {
    if (donnees.silence) {
      return t('recitationLive.silence') || "Aucun son n'a été capté. Vérifie ton micro.";
    }
    if (!donnees.fiable) {
      return (
        t('recitationLive.malEntendu') ||
        "Je n'ai pas bien entendu — les mots ci-dessous ne sont pas fiables."
      );
    }
    return null;
  };

  const couleurDuMot = (etat: EtatMot) => {
    switch (etat) {
      case 'juste':
        return styles.motJuste;
      case 'approximatif':
        return styles.motApproximatif;
      case 'errone':
      case 'oublie':
        return styles.motFautif;
      default:
        return styles.motEnAttente;
    }
  };

  const libelleAccessible = (mot: MotSuivi) => {
    const etats: Record<EtatMot, string> = {
      juste: t('recitationLive.etat.juste') || 'juste',
      approximatif: t('recitationLive.etat.approximatif') || 'approximatif',
      errone: t('recitationLive.etat.errone') || 'erroné',
      oublie: t('recitationLive.etat.oublie') || 'oublié',
      en_attente: t('recitationLive.etat.enAttente') || 'pas encore récité',
    };
    return `${mot.attendu}, ${etats[mot.etat]}`;
  };

  if (phase === 'verification') {
    return (
      <View style={[styles.centre, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (phase === 'indisponible') {
    return (
      <View style={[styles.centre, { paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={44} color={colors.textMuted} />
        <Text style={styles.titreIndisponible}>
          {t('recitationLive.indisponibleTitre') || 'Suivi de récitation indisponible'}
        </Text>
        <Text style={styles.texteIndisponible}>
          {t('recitationLive.indisponibleTexte') ||
            "Le moteur d'analyse ne répond pas. Réessaie plus tard."}
        </Text>
        <Pressable
          style={styles.boutonSecondaire}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back') || 'Retour'}
        >
          <Text style={styles.boutonSecondaireTexte}>{t('common.back') || 'Retour'}</Text>
        </Pressable>
      </View>
    );
  }

  const enregistre = phase === 'enregistrement';
  const analyse = phase === 'analyse';
  const modeVerrouille = enregistre || analyse;

  return (
    <View style={[styles.ecran, { paddingTop: insets.top }]}>
      <View style={styles.entete}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back') || 'Retour'}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.titre}>{t('recitationLive.titre') || 'Récitation suivie'}</Text>
        <Text style={styles.reference}>
          {surahNumber}:{ayahNumber}
        </Text>
      </View>

      <View style={styles.selecteurMode}>
        {(['verdict', 'suivi'] as Mode[]).map((valeur) => (
          <Pressable
            key={valeur}
            style={[styles.ongletMode, mode === valeur && styles.ongletModeActif]}
            onPress={() => setMode(valeur)}
            disabled={modeVerrouille}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === valeur, disabled: modeVerrouille }}
            accessibilityLabel={
              valeur === 'verdict'
                ? t('recitationLive.modeVerdict') || 'Bilan complet'
                : t('recitationLive.modeSuivi') || 'Suivi en direct'
            }
          >
            <Text style={[styles.ongletTexte, mode === valeur && styles.ongletTexteActif]}>
              {valeur === 'verdict'
                ? t('recitationLive.modeVerdict') || 'Bilan complet'
                : t('recitationLive.modeSuivi') || 'Suivi en direct'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.corps}>
        <View style={styles.carteVerset}>
          <Text style={styles.verset}>
            {mots.map((mot) => (
              <Text
                key={mot.index}
                style={[styles.mot, couleurDuMot(mot.etat)]}
                accessibilityLabel={libelleAccessible(mot)}
              >
                {mot.attendu}{' '}
              </Text>
            ))}
          </Text>
        </View>

        {message ? (
          <View style={styles.bandeauMessage}>
            <Ionicons name="information-circle-outline" size={18} color={colors.warningStrong} />
            <Text style={styles.texteMessage}>{message}</Text>
          </View>
        ) : null}

        {/* L'exactitude ne s'affiche que si elle veut dire quelque chose : ni
            sur un silence, ni sur une transcription dont le moteur doute. */}
        {resultat && resultat.fiable && !resultat.silence && resultat.exactitude !== null ? (
          <View style={styles.carteResultat}>
            <Text style={styles.exactitude}>{Math.round(resultat.exactitude)} %</Text>
            <Text style={styles.exactitudeLegende}>
              {t('recitationLive.motsReconnus') || 'des mots reconnus'}
            </Text>
            <View style={styles.legende}>
              <Puce style={styles.motJuste} texte={t('recitationLive.etat.juste') || 'juste'} styles={styles} />
              <Puce
                style={styles.motApproximatif}
                texte={t('recitationLive.etat.approximatif') || 'approximatif'}
                styles={styles}
              />
              <Puce
                style={styles.motFautif}
                texte={t('recitationLive.etat.aRevoir') || 'à revoir'}
                styles={styles}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.pied, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.boutonMicro, enregistre && styles.boutonMicroActif]}
          onPress={enregistre ? arreter : demarrer}
          disabled={analyse}
          accessibilityRole="button"
          accessibilityState={{ disabled: analyse, busy: analyse }}
          accessibilityLabel={
            enregistre
              ? t('recitationLive.arreter') || 'Arrêter et analyser'
              : t('recitationLive.commencer') || 'Commencer à réciter'
          }
        >
          {analyse ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Ionicons name={enregistre ? 'stop' : 'mic'} size={30} color={colors.surface} />
          )}
        </Pressable>

        <Text style={styles.consigne}>
          {analyse
            ? t('recitationLive.enAnalyse') || 'Analyse en cours…'
            : enregistre
            ? t('recitationLive.enCours') || 'Récite le verset, puis appuie pour arrêter'
            : mode === 'suivi'
            ? t('recitationLive.consigneSuivi') || 'Appuie : les mots se colorent à mesure'
            : t('recitationLive.consigne') || 'Appuie et récite le verset'}
        </Text>
      </View>
    </View>
  );
}

function Puce({ style, texte, styles }: any) {
  return (
    <View style={styles.puce}>
      <View style={[styles.pastille, style]} />
      <Text style={styles.puceTexte}>{texte}</Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.background },
    centre: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
      padding: 28,
      gap: 12,
    },
    entete: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    titre: { color: c.text, fontSize: 17, fontWeight: '700' },
    reference: { color: c.textSecondary, fontSize: 15, fontWeight: '600' },

    selecteurMode: {
      flexDirection: 'row',
      marginHorizontal: 16,
      backgroundColor: c.surfaceAlt,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    ongletMode: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
    ongletModeActif: { backgroundColor: c.surface },
    ongletTexte: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    ongletTexteActif: { color: c.primary },

    corps: { padding: 16, gap: 16 },
    carteVerset: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
    },
    verset: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 52 },
    mot: { fontSize: 26, lineHeight: 52 },
    motEnAttente: { color: c.textMuted },
    motJuste: { color: c.success },
    motApproximatif: { color: c.warningStrong },
    motFautif: { color: c.error },

    bandeauMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.warningSoft,
      borderRadius: 14,
      padding: 14,
    },
    texteMessage: { color: c.text, fontSize: 14, flex: 1, lineHeight: 20 },

    carteResultat: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      alignItems: 'center',
      gap: 4,
    },
    exactitude: { color: c.primary, fontSize: 40, fontWeight: '800' },
    exactitudeLegende: { color: c.textSecondary, fontSize: 14 },
    legende: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 12,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    puce: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pastille: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.textMuted },
    puceTexte: { color: c.textSecondary, fontSize: 13 },

    pied: { alignItems: 'center', gap: 12, paddingHorizontal: 16 },
    boutonMicro: {
      width: 74,
      height: 74,
      borderRadius: 37,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boutonMicroActif: { backgroundColor: c.error },
    consigne: { color: c.textSecondary, fontSize: 14, textAlign: 'center' },

    titreIndisponible: { color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
    texteIndisponible: { color: c.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    boutonSecondaire: {
      marginTop: 8,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: c.primarySoft,
    },
    boutonSecondaireTexte: { color: c.primary, fontWeight: '700' },
  });
