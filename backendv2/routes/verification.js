/**
 * Verification Routes - Salifz Backend
 * SMS, Email, Biometric verification
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');

const otpStore = new Map();
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Phone SMS OTP
router.post('/phone/send', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number required' });
    const otp = generateOTP();
    otpStore.set(`phone:${phoneNumber}`, { otp, expiresAt: Date.now() + 600000 });
    console.log(`[SMS OTP] ${phoneNumber}: ${otp}`);
    res.json({ success: true, message: 'OTP sent', ...(process.env.NODE_ENV !== 'production' && { simulatedOtp: otp }) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to send OTP' }); }
});

router.post('/phone/verify', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const stored = otpStore.get(`phone:${phoneNumber}`);
    if (!stored || Date.now() > stored.expiresAt) return res.status(400).json({ success: false, message: 'OTP expired' });
    if (stored.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    otpStore.delete(`phone:${phoneNumber}`);
    if (req.user) await User.findByIdAndUpdate(req.user.id, { phoneNumber, phoneVerified: true });
    res.json({ success: true, message: 'Phone verified' });
  } catch (error) { res.status(500).json({ success: false, message: 'Verification failed' }); }
});

// Email OTP
router.post('/email/send', async (req, res) => {
  try {
    const { email, type = 'otp' } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const otp = generateOTP();
    otpStore.set(`email:${email}`, { otp, expiresAt: Date.now() + 600000 });
    console.log(`[Email OTP] ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP sent', ...(process.env.NODE_ENV !== 'production' && { simulatedOtp: otp }) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to send' }); }
});

router.post('/email/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const stored = otpStore.get(`email:${email}`);
    if (!stored || Date.now() > stored.expiresAt) return res.status(400).json({ success: false, message: 'OTP expired' });
    if (stored.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    otpStore.delete(`email:${email}`);
    if (req.user) await User.findByIdAndUpdate(req.user.id, { emailVerified: true });
    res.json({ success: true, message: 'Email verified' });
  } catch (error) { res.status(500).json({ success: false, message: 'Verification failed' }); }
});

// Biometric
router.post('/biometric/setup', async (req, res) => {
  try {
    const { deviceId, biometricType } = req.body;
    await User.findByIdAndUpdate(req.user.id, { biometricEnabled: true, biometricDeviceId: deviceId, biometricType });
    res.json({ success: true, message: 'Biometric enabled' });
  } catch (error) { res.status(500).json({ success: false, message: 'Setup failed' }); }
});

router.post('/biometric/verify', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user?.biometricEnabled) return res.status(400).json({ success: false, message: 'Biometric not enabled' });
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) { res.status(500).json({ success: false, message: 'Verification failed' }); }
});

module.exports = router;