/**
 * Captures d'écran de l'application web, une par écran.
 *
 * La première tentative pilotait une fenêtre Edge visible et déclenchait des
 * captures d'écran système à intervalle régulier. Le décalage entre la
 * navigation et le déclencheur a désynchronisé la série de trois positions —
 * la capture nommée « Statistiques » montrait les notifications — et l'une
 * d'elles a même attrapé un onglet sans rapport. Une série de captures dont
 * les noms mentent est pire que pas de captures du tout.
 *
 * Ce script supprime le problème à la racine : Edge tourne sans interface, et
 * chaque capture est demandée par le protocole de débogage *après* que la page
 * a signalé sa fin de chargement. Le nom du fichier ne peut plus se retrouver
 * sur la mauvaise page, puisque c'est la même commande qui navigue et capture.
 *
 *   node web/scripts/captures.mjs [dossier de sortie]
 */

import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';

const ORIGINE = process.env.SALIFZ_WEB ?? 'http://localhost:5173';
const API = process.env.SALIFZ_API ?? 'http://localhost:8088/api/v1';
// Port tire au hasard : une execution interrompue laisse une instance
// derriere elle, et un port fixe fait que la suivante s'y raccroche pour
// piloter des onglets morts — le script attendait alors indefiniment.
const PORT_CDP = 9300 + Math.floor(Math.random() * 400);
const LARGEUR = 1440;
const HAUTEUR = 900;

const IDENTIFIANTS = {
  emailOrUsername: process.env.SALIFZ_USER ?? 'test@salifz.com',
  password: process.env.SALIFZ_PASS ?? 'Salifz2026',
};

/** Les 25 écrans, dans l'ordre de la spécification. */
const ECRANS = [
  ['01', 'Accueil', '/accueil'],
  ['02', 'Lecons', '/lecons'],
  ['03', 'Revision', '/revision'],
  ['04', 'Mushaf', '/mushaf'],
  ['05', 'Mot-a-mot', '/mot-a-mot/1/1'],
  ['06', 'Verset-du-jour', '/verset-du-jour'],
  ['07', 'Halaqat', '/halaqat'],
  ['08', 'Khatam', '/khatam'],
  ['09', 'Amis', '/amis'],
  ['10', 'Recitations', '/recitations'],
  ['11', 'Classement', '/classement'],
  ['12', 'Defis', '/defis'],
  ['13', 'Serie', '/serie'],
  ['14', 'Statistiques', '/statistiques'],
  ['15', 'Boutique', '/boutique'],
  ['16', 'Priere-qibla', '/priere'],
  ['17', 'Notifications', '/notifications'],
  ['18', 'Abonnement', '/abonnement'],
  ['19', 'Profil', '/profil'],
  ['20', 'Reglages', '/reglages'],
];

const ECRANS_PUBLICS = [
  ['21', 'Landing', '/'],
  ['22', 'Connexion', '/login'],
  ['23', 'Inscription', '/inscription'],
  ['24', 'Mot-de-passe-oublie', '/mot-de-passe-oublie'],
  ['25', 'Confidentialite', '/confidentialite'],
];

/** Un échantillon en arabe : c'est là que le sens de lecture se vérifie. */
const ECRANS_AR = [
  ['ar-01', 'Accueil', '/accueil'],
  ['ar-04', 'Mushaf', '/mushaf'],
  ['ar-14', 'Statistiques', '/statistiques'],
  ['ar-21', 'Landing', '/'],
];

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Edge se deploie en arborescence : tuer le seul parent laisse derriere
 *  lui des processus qui gardent le port de debogage et le profil. */
function arreterEdge(proc) {
  try {
    spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch {
    proc.kill();
  }
}

// ---------------------------------------------------------------------------
// Client CDP minimal. Node 22+ fournit WebSocket nativement : pas de
// dépendance à installer pour un script qui ne tourne qu'à la demande.
// ---------------------------------------------------------------------------
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.attente = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      const resolveur = this.attente.get(msg.id);
      if (resolveur) {
        this.attente.delete(msg.id);
        msg.error ? resolveur.rejeter(new Error(msg.error.message)) : resolveur.resoudre(msg.result);
      }
    });
  }

  static async ouvrir(url) {
    const ws = new WebSocket(url);
    await new Promise((r, j) => {
      ws.addEventListener('open', r, { once: true });
      ws.addEventListener('error', () => j(new Error('connexion CDP impossible')), { once: true });
    });
    return new Cdp(ws);
  }

  fermer() {
    this.ws.close();
  }

  envoyer(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resoudre, rejeter) => this.attente.set(id, { resoudre, rejeter }));
  }
}

async function principal() {
  if (!EDGE) throw new Error('Edge introuvable.');

  const sortie = process.argv[2] ?? join(homedir(), 'Desktop', 'salifz-captures');
  await mkdir(sortie, { recursive: true });

  // --- Jeton : obtenu par l'API, pas par une saisie simulée dans le
  //     formulaire. Un formulaire rempli au clavier virtuel est une source de
  //     décalage de plus, pour un résultat identique.
  const connexion = async () => {
    const reponse = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(IDENTIFIANTS),
    });
    const charge = await reponse.json();
    const acces = charge?.data?.token ?? charge?.token;
    if (!acces) throw new Error(`connexion refusée : ${JSON.stringify(charge).slice(0, 200)}`);
    // Le jeton de rafraichissement compte autant que celui d'acces : sans lui,
    // le premier 401 fait vider la session au client, et l'ecran suivant se
    // capture sur la page de connexion. C'est ce qui est arrive au mushaf en
    // arabe, vingt-cinq ecrans apres le debut de la serie.
    return { acces, rafraichir: charge?.data?.refreshToken ?? charge?.refreshToken ?? '' };
  };

  let session = await connexion();
  console.log('jeton obtenu');

  // --- Edge sans interface, profil jetable pour partir d'un état connu.
  const profil = join(tmpdir(), `salifz-captures-${Date.now()}`);
  const edge = spawn(EDGE, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT_CDP}`,
    `--user-data-dir=${profil}`,
    `--window-size=${LARGEUR},${HAUTEUR}`,
    'about:blank',
  ], { stdio: 'ignore' });

  let cible;
  for (let essai = 0; essai < 40; essai++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT_CDP}/json/list`);
      const cibles = await r.json();
      cible = cibles.find((c) => c.type === 'page');
      if (cible) break;
    } catch { /* Edge n'écoute pas encore */ }
    await dormir(250);
  }
  if (!cible) throw new Error('Edge n’a pas ouvert son port de débogage.');

  const cdp = await Cdp.ouvrir(cible.webSocketDebuggerUrl);
  await cdp.envoyer('Page.enable');
  await cdp.envoyer('Runtime.enable');

  // L'amorce est injectee *avant* le premier script de la page. C'est ce qui
  // permet de supprimer la navigation intermediaire vers la racine : elle
  // servait uniquement a obtenir une origine ou ecrire dans le stockage, mais
  // chargeait l'accueil complet a chaque ecran. Trente ecrans x deux pages
  // depassaient le filet de 120 requetes par minute de l'API ; le
  // rafraichissement du jeton se faisait alors refuser a son tour, le client
  // vidait la session, et la capture suivante montrait la page de connexion.
  // Les ecrans en echec changeaient d'une execution a l'autre, ce qui est la
  // signature d'une limite de debit et non d'un defaut d'un ecran precis.
  let amorce = null;

  const preparerSession = async (langue, connecte) => {
    if (amorce) await cdp.envoyer('Page.removeScriptToEvaluateOnNewDocument', { identifier: amorce });
    const source = connecte
      ? `localStorage.setItem('salifz:token', ${JSON.stringify(session.acces)});
         localStorage.setItem('salifz:refreshToken', ${JSON.stringify(session.rafraichir)});
         localStorage.setItem('salifz:locale', ${JSON.stringify(langue)});`
      : `localStorage.removeItem('salifz:token');
         localStorage.removeItem('salifz:refreshToken');
         localStorage.setItem('salifz:locale', ${JSON.stringify(langue)});`;
    const { identifier } = await cdp.envoyer('Page.addScriptToEvaluateOnNewDocument', { source });
    amorce = identifier;
  };

  /**
   * Attend que la page ait vraiment quelque chose a montrer.
   *
   * Une attente fixe ne suffisait pas : la toute premiere capture est partie
   * sur une page blanche parce que Vite compilait encore ses modules, et le
   * controle d'adresse l'a laissee passer — l'URL etait la bonne, la page
   * etait vide. On attend donc du texte rendu, pas un delai.
   */
  const attendreRendu = async (limiteMs = 15000) => {
    const debut = Date.now();
    let dernier = 0;
    while (Date.now() - debut < limiteMs) {
      const { result } = await cdp.envoyer('Runtime.evaluate', {
        expression: '(document.body && document.body.innerText || "").trim().length',
        returnByValue: true,
      });
      const taille = result.value ?? 0;
      // Deux mesures identiques et non nulles : le rendu s'est stabilise, les
      // traductions du namespace sont arrivees.
      if (taille > 80 && taille === dernier) return taille;
      dernier = taille;
      await dormir(500);
    }
    return dernier;
  };

  const capturer = async (numero, nom, chemin, langue = 'fr', essai = 1) => {
    await cdp.envoyer('Page.navigate', { url: `${ORIGINE}${chemin}` });
    const texte = await attendreRendu();

    const { data } = await cdp.envoyer('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(sortie, `${numero} - ${nom}.png`), Buffer.from(data, 'base64'));

    // Deux controles, parce qu'un seul ne suffit pas : l'adresse dit qu'on est
    // sur le bon ecran, la quantite de texte dit qu'il a fini de s'afficher.
    const { result } = await cdp.envoyer('Runtime.evaluate', {
      expression: '[location.pathname, document.documentElement.dir].join("|")',
      returnByValue: true,
    });
    const [adresse, sens] = String(result.value).split('|');
    const bonneAdresse = adresse === chemin;
    const bonSens = sens === (langue === 'ar' ? 'rtl' : 'ltr');
    const rendu = texte > 80;
    const ok = bonneAdresse && rendu && bonSens;
    const motif = !bonneAdresse
      ? adresse
      : !rendu
        ? `page quasi vide (${texte} caracteres)`
        : `sens de lecture ${sens} au lieu de ${langue === 'ar' ? 'rtl' : 'ltr'}`;
    // Un ecran peut revenir vide une fois sur dix : le plus lourd de tous —
    // la liste des 114 sourates — depasse parfois l'attente quand Vite vient
    // de recompiler ses modules. Une seule reprise suffit, et la signaler
    // vaut mieux que d'allonger l'attente de tous les autres.
    if (!ok && essai === 1) {
      console.log(`      ${numero} ${nom} : ${motif} — reprise`);
      return capturer(numero, nom, chemin, langue, 2);
    }

    console.log(`${ok ? 'ok  ' : 'ECART'} ${numero} ${nom.padEnd(22)} ${ok ? `${texte} car. ${sens}` : motif}`);
    return ok;
  };

  let ecarts = 0;

  await preparerSession('fr', true);
  // Prechauffage : le premier chargement paie la compilation des modules par
  // Vite. Sans lui, c'est la capture 01 qui la paie — et elle sort blanche.
  await cdp.envoyer('Page.navigate', { url: `${ORIGINE}/accueil` });
  await attendreRendu(30000);

  for (const [n, nom, chemin] of ECRANS) {
    if (!(await capturer(n, nom, chemin))) ecarts++;
  }

  // Deconnecte : la connexion, l'inscription et la page de presentation
  // renvoient vers l'accueil des qu'une session existe. C'est le comportement
  // attendu du produit, et le controle d'adresse l'a revele — les trois
  // premieres captures publiques montraient l'accueil sous le nom « Landing ».
  await preparerSession('fr', false);
  for (const [n, nom, chemin] of ECRANS_PUBLICS) {
    if (!(await capturer(n, nom, chemin))) ecarts++;
  }

  session = await connexion();
  for (const [n, nom, chemin] of ECRANS_AR) {
    await preparerSession('ar', chemin !== '/');
    if (!(await capturer(n, `${nom}-arabe`, chemin, 'ar'))) ecarts++;
  }

  // La connexion de debogage doit etre fermee explicitement : tant qu'elle
  // reste ouverte, la boucle d'evenements de Node ne se vide pas et le script
  // ne rend jamais la main, alors meme que les captures sont toutes ecrites.
  cdp.fermer();
  arreterEdge(edge);
  await dormir(1500);
  await rm(profil, { recursive: true, force: true }).catch(() => {});

  console.log(`\n${ECRANS.length + ECRANS_PUBLICS.length + ECRANS_AR.length} captures dans ${sortie}`);
  if (ecarts) {
    console.error(`${ecarts} écran(s) n’ont pas affiché l’adresse attendue.`);
    process.exit(1);
  }
}

principal().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
