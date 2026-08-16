/**
 * Serveur de développement autonome — Salifz
 *
 * Démarre une instance MongoDB en mémoire puis lance l'API. Permet de faire
 * tourner l'application sans installer MongoDB sur la machine.
 *
 *   npm run dev:standalone
 *
 * Les données ne survivent pas à l'arrêt du processus : c'est un
 * environnement de démonstration et de développement, pas de production.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const crypto = require('crypto');

async function main() {
  console.log('⏳ Démarrage de MongoDB en mémoire (téléchargement au premier lancement)...');

  const mongo = await MongoMemoryServer.create({
    instance: { dbName: 'salifz' },
  });

  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;
  console.log(`✅ MongoDB en mémoire prêt : ${uri}`);

  // Secrets éphémères si le .env n'en fournit pas : le serveur refuse de
  // démarrer sans (voir config/env.js), et c'est voulu.
  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'JWT_RESET_SECRET']) {
    if (!process.env[key]) {
      process.env[key] = crypto.randomBytes(48).toString('base64url');
      console.log(`ℹ️  ${key} généré pour cette session.`);
    }
  }

  require('../index.js');

  // La base en mémoire repart vide à chaque lancement : on y sème le compte
  // de démonstration pour que le bouton « Test User » fonctionne tout de suite.
  const mongoose = require('mongoose');
  mongoose.connection.once('connected', async () => {
    try {
      const { seedTestUser, TEST_EMAIL, TEST_PASSWORD } = require('./seed-test-user');
      await seedTestUser();
      console.log(`🧪 Compte de démonstration : ${TEST_EMAIL} / ${TEST_PASSWORD}`);
    } catch (error) {
      console.error('⚠️  Seed du compte de test impossible :', error.message);
    }
  });

  const shutdown = async () => {
    console.log('\n⏹  Arrêt du serveur et de MongoDB...');
    await mongo.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('❌ Démarrage impossible :', error);
  process.exit(1);
});
