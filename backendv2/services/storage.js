/**
 * Stockage des fichiers — Salifz
 *
 * Les enregistrements de récitation étaient écrits sur le disque du conteneur.
 * Ce disque est éphémère : une mise à jour de l'image, un redéploiement ou un
 * passage à deux instances et les fichiers disparaissent — ou ne sont visibles
 * que d'une instance sur deux.
 *
 * Ce module choisit sa destination selon la configuration :
 *   - `S3_BUCKET` renseigné  → stockage objet (S3, MinIO, R2, tout ce qui
 *     parle le protocole S3) ;
 *   - sinon                  → disque local, suffisant en développement.
 *
 * Les appelants ne voient qu'une seule interface : `save`, `remove`, `url`.
 */

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const LOCAL_ROOT = path.join(__dirname, '..', 'uploads');

const config = {
  bucket: process.env.S3_BUCKET || null,
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || null, // MinIO, R2 : point d'entrée explicite
  accessKeyId: process.env.S3_ACCESS_KEY || null,
  secretAccessKey: process.env.S3_SECRET_KEY || null,
  publicBaseUrl: process.env.S3_PUBLIC_URL || null,
  // MinIO exige le style « chemin » ; S3 accepte les deux.
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
};

const useObjectStorage = Boolean(config.bucket && config.accessKeyId && config.secretAccessKey);

let client = null;

function s3() {
  if (client) return client;
  const { S3Client } = require('@aws-sdk/client-s3');
  client = new S3Client({
    region: config.region,
    endpoint: config.endpoint || undefined,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return client;
}

/** Nom de fichier imprévisible : un identifiant séquentiel serait devinable. */
function buildKey(prefix, originalName) {
  const ext = path.extname(originalName || '') || '.bin';
  return `${prefix}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

/**
 * Enregistre un fichier et renvoie sa clé.
 * `buffer` vient de multer en mémoire — le même appelant fonctionne quelle
 * que soit la destination.
 */
async function save({ prefix, originalName, buffer, contentType }) {
  const key = buildKey(prefix, originalName);

  if (useObjectStorage) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await s3().send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      })
    );
    return key;
  }

  const target = path.join(LOCAL_ROOT, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  return key;
}

/**
 * URL de lecture.
 *
 * En stockage objet, une URL signée à durée limitée est préférée : le contenu
 * d'une récitation n'a pas à être lisible par quiconque devine son adresse.
 * Si `S3_PUBLIC_URL` est fourni, le bucket est considéré comme public et
 * l'URL est construite directement.
 */
async function url(key, expiresInSeconds = 3600) {
  if (!key) return null;

  if (useObjectStorage) {
    if (config.publicBaseUrl) {
      return `${config.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    return getSignedUrl(
      s3(),
      new GetObjectCommand({ Bucket: config.bucket, Key: key }),
      { expiresIn: expiresInSeconds }
    );
  }

  return `/uploads/${key}`;
}

async function remove(key) {
  if (!key) return;

  if (useObjectStorage) {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    await s3()
      .send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
      .catch(() => {});
    return;
  }

  await fs.rm(path.join(LOCAL_ROOT, key), { force: true }).catch(() => {});
}

function describe() {
  return useObjectStorage
    ? `objet (${config.endpoint || 's3'} / ${config.bucket})`
    : 'disque local (éphémère — à ne pas utiliser en production)';
}

module.exports = { save, url, remove, describe, useObjectStorage, LOCAL_ROOT };
