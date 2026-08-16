/**
 * Cycle de vie du compte — Salifz
 *
 * Corrige S19. L'application n'offrait aucun moyen de supprimer son compte ni
 * d'exporter ses données. C'est exigé par le RGPD (art. 15 et 17), par la
 * règle 5.1.1(v) de l'App Store et par la politique de suppression de compte
 * de Google Play.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { passwordResetLimiter } = require('../middleware/rateLimit');

const router = express.Router();

/** Collections rattachées à un utilisateur, purgées avec son compte. */
const OWNED_COLLECTIONS = [
  ['SurahProgress', 'userId'],
  ['Streak', 'userId'],
  ['Notification', 'userId'],
  ['Friend', 'userId'],
  ['Message', 'senderId'],
  ['Achievement', 'userId'],
];

/**
 * GET /api/v1/account/export
 * Export de toutes les données personnelles (RGPD art. 15).
 */
router.get('/export', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ success: false, error: 'Compte introuvable' });

    delete user.password;
    delete user.resetPasswordToken;

    const related = {};
    for (const [modelName, field] of OWNED_COLLECTIONS) {
      try {
        const Model = require(`../models/${modelName}`);
        related[modelName] = await Model.find({ [field]: req.userId }).lean();
      } catch {
        // Modèle absent : rien à exporter pour cette collection.
      }
    }

    res.setHeader('Content-Disposition', 'attachment; filename="salifz-mes-donnees.json"');
    res.json({
      exportedAt: new Date().toISOString(),
      account: user,
      data: related,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/account
 * Suppression définitive du compte et des données rattachées.
 *
 * Le mot de passe est redemandé : un jeton volé ne doit pas suffire à
 * détruire un compte.
 */
router.delete(
  '/',
  passwordResetLimiter,
  [body('password').isString().notEmpty(), body('confirm').equals('SUPPRIMER')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Mot de passe requis, et le champ `confirm` doit valoir "SUPPRIMER".',
          details: errors.array(),
        });
      }

      const user = await User.findById(req.userId).select('+password');
      if (!user) return res.status(404).json({ success: false, error: 'Compte introuvable' });

      const passwordMatches = await user.comparePassword(req.body.password);
      if (!passwordMatches) {
        return res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
      }

      // Un parent ne peut pas disparaître en laissant des comptes enfants
      // orphelins et non supervisés.
      const childCount = await User.countDocuments({ 'parentalControls.parentId': user._id });
      if (childCount > 0) {
        return res.status(409).json({
          success: false,
          error: `Supprimez d'abord les ${childCount} compte(s) enfant rattaché(s) à ce compte.`,
          code: 'CHILD_ACCOUNTS_EXIST',
        });
      }

      for (const [modelName, field] of OWNED_COLLECTIONS) {
        try {
          const Model = require(`../models/${modelName}`);
          await Model.deleteMany({ [field]: user._id });
        } catch {
          // Modèle absent : rien à purger.
        }
      }

      await User.findByIdAndDelete(user._id);

      console.log(`[ACCOUNT] Compte ${user._id} supprimé à la demande de son titulaire.`);

      res.json({
        success: true,
        message: 'Votre compte et vos données ont été supprimés définitivement.',
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
