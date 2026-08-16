/**
 * Prayer & Qibla Routes - Salifz
 * ✅ COMPLETE: Prayer times and Qibla direction
 * Uses Aladhan API: https://aladhan.com/prayer-times-api
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const ALADHAN_API = 'https://api.aladhan.com/v1';

// Cache pour les données de prière
const prayerCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// ============================================
// PRAYER TIMES BY COORDINATES
// ============================================
router.get('/times', async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      method = 4,  // 4 = Umm Al-Qura (Makkah)
      school = 0,  // 0 = Shafi, 1 = Hanafi
      date         // optional: DD-MM-YYYY
    } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const cacheKey = `prayer:${latitude}:${longitude}:${method}:${date || 'today'}`;
    const cached = prayerCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({ success: true, data: cached.data, cached: true });
    }
    
    let url = `${ALADHAN_API}/timings`;
    if (date) url += `/${date}`;
    
    const response = await axios.get(url, {
      params: { latitude, longitude, method, school }
    });
    
    const timings = response.data.data.timings;
    const dateInfo = response.data.data.date;
    const meta = response.data.data.meta;
    
    const prayerData = {
      timings: {
        fajr: timings.Fajr,
        sunrise: timings.Sunrise,
        dhuhr: timings.Dhuhr,
        asr: timings.Asr,
        maghrib: timings.Maghrib,
        isha: timings.Isha,
        imsak: timings.Imsak,
        midnight: timings.Midnight
      },
      date: {
        readable: dateInfo.readable,
        timestamp: dateInfo.timestamp,
        hijri: {
          date: dateInfo.hijri.date,
          day: dateInfo.hijri.day,
          month: dateInfo.hijri.month.en,
          monthAr: dateInfo.hijri.month.ar,
          year: dateInfo.hijri.year
        },
        gregorian: {
          date: dateInfo.gregorian.date,
          day: dateInfo.gregorian.day,
          month: dateInfo.gregorian.month.en,
          year: dateInfo.gregorian.year,
          weekday: dateInfo.gregorian.weekday.en
        }
      },
      meta: {
        timezone: meta.timezone,
        method: meta.method.name,
        school: meta.school
      },
      nextPrayer: calculateNextPrayer(timings)
    };
    
    prayerCache.set(cacheKey, { data: prayerData, timestamp: Date.now() });
    
    res.json({ success: true, data: prayerData });
  } catch (error) {
    console.error('Get prayer times error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PRAYER TIMES BY CITY
// ============================================
router.get('/times/city', async (req, res) => {
  try {
    const { city, country, state, method = 4, school = 0 } = req.query;
    
    if (!city || !country) {
      return res.status(400).json({
        success: false,
        error: 'City and country are required'
      });
    }
    
    const response = await axios.get(`${ALADHAN_API}/timingsByCity`, {
      params: { city, country, state, method, school }
    });
    
    const timings = response.data.data.timings;
    const dateInfo = response.data.data.date;
    
    res.json({
      success: true,
      data: {
        timings: {
          fajr: timings.Fajr,
          sunrise: timings.Sunrise,
          dhuhr: timings.Dhuhr,
          asr: timings.Asr,
          maghrib: timings.Maghrib,
          isha: timings.Isha
        },
        date: dateInfo,
        nextPrayer: calculateNextPrayer(timings)
      }
    });
  } catch (error) {
    console.error('Get prayer times by city error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MONTHLY PRAYER CALENDAR
// ============================================
router.get('/calendar', async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
      method = 4
    } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const response = await axios.get(`${ALADHAN_API}/calendar`, {
      params: { latitude, longitude, method, month, year }
    });
    
    const calendar = response.data.data.map(day => ({
      date: day.date.gregorian.date,
      hijriDate: day.date.hijri.date,
      timings: {
        fajr: day.timings.Fajr.split(' ')[0],
        sunrise: day.timings.Sunrise.split(' ')[0],
        dhuhr: day.timings.Dhuhr.split(' ')[0],
        asr: day.timings.Asr.split(' ')[0],
        maghrib: day.timings.Maghrib.split(' ')[0],
        isha: day.timings.Isha.split(' ')[0]
      }
    }));
    
    res.json({ success: true, data: calendar });
  } catch (error) {
    console.error('Get prayer calendar error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CALCULATION METHODS
// ============================================
router.get('/methods', async (req, res) => {
  try {
    const response = await axios.get(`${ALADHAN_API}/methods`);
    
    const methods = Object.entries(response.data.data).map(([key, value]) => ({
      id: parseInt(key),
      name: value.name,
      params: value.params
    }));
    
    res.json({ success: true, data: methods });
  } catch (error) {
    // Fallback
    res.json({
      success: true,
      data: [
        { id: 1, name: 'University of Islamic Sciences, Karachi' },
        { id: 2, name: 'Islamic Society of North America (ISNA)' },
        { id: 3, name: 'Muslim World League' },
        { id: 4, name: 'Umm Al-Qura University, Makkah' },
        { id: 5, name: 'Egyptian General Authority of Survey' },
        { id: 7, name: 'Institute of Geophysics, University of Tehran' },
        { id: 8, name: 'Gulf Region' },
        { id: 9, name: 'Kuwait' },
        { id: 10, name: 'Qatar' },
        { id: 11, name: 'Majlis Ugama Islam Singapura' },
        { id: 12, name: 'Union Organization Islamic de France' },
        { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey' },
        { id: 14, name: 'Spiritual Administration of Muslims of Russia' },
        { id: 21, name: 'Moroccan Ministry of Habous and Islamic Affairs' }
      ]
    });
  }
});

// ============================================
// QIBLA DIRECTION
// ============================================
router.get('/qibla', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const response = await axios.get(`${ALADHAN_API}/qibla/${latitude}/${longitude}`);
    
    const direction = response.data.data.direction;
    const compassDirection = getCompassDirection(direction);
    
    res.json({
      success: true,
      data: {
        direction: direction,
        compassDirection: compassDirection,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        kaaba: {
          latitude: 21.4225,
          longitude: 39.8262
        },
        distanceToMecca: calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          21.4225,
          39.8262
        )
      }
    });
  } catch (error) {
    console.error('Get qibla error:', error.message);
    
    // Fallback calculation
    const lat = parseFloat(req.query.latitude);
    const lng = parseFloat(req.query.longitude);
    
    if (lat && lng) {
      const direction = calculateQiblaDirection(lat, lng);
      res.json({
        success: true,
        data: {
          direction: direction,
          compassDirection: getCompassDirection(direction),
          latitude: lat,
          longitude: lng,
          kaaba: { latitude: 21.4225, longitude: 39.8262 },
          distanceToMecca: calculateDistance(lat, lng, 21.4225, 39.8262)
        },
        calculated: true
      });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateNextPrayer(timings) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const prayers = [
    { name: 'fajr', nameAr: 'الفجر', time: timings.Fajr },
    { name: 'sunrise', nameAr: 'الشروق', time: timings.Sunrise },
    { name: 'dhuhr', nameAr: 'الظهر', time: timings.Dhuhr },
    { name: 'asr', nameAr: 'العصر', time: timings.Asr },
    { name: 'maghrib', nameAr: 'المغرب', time: timings.Maghrib },
    { name: 'isha', nameAr: 'العشاء', time: timings.Isha }
  ];
  
  for (const prayer of prayers) {
    const timeStr = prayer.time.split(' ')[0]; // Remove timezone
    const [hours, minutes] = timeStr.split(':').map(Number);
    const prayerTime = hours * 60 + minutes;
    
    if (prayerTime > currentTime) {
      const remainingMinutes = prayerTime - currentTime;
      return {
        name: prayer.name,
        nameAr: prayer.nameAr,
        time: timeStr,
        remaining: {
          hours: Math.floor(remainingMinutes / 60),
          minutes: remainingMinutes % 60,
          total: remainingMinutes
        }
      };
    }
  }
  
  // Next is Fajr tomorrow
  const fajrTime = timings.Fajr.split(' ')[0];
  const [fajrHours, fajrMinutes] = fajrTime.split(':').map(Number);
  const remainingMinutes = (24 * 60 - currentTime) + (fajrHours * 60 + fajrMinutes);
  
  return {
    name: 'fajr',
    nameAr: 'الفجر',
    time: fajrTime,
    remaining: {
      hours: Math.floor(remainingMinutes / 60),
      minutes: remainingMinutes % 60,
      total: remainingMinutes
    },
    tomorrow: true
  };
}

function calculateQiblaDirection(lat, lng) {
  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;
  
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const kaabaLatRad = (kaabaLat * Math.PI) / 180;
  const kaabaLngRad = (kaabaLng * Math.PI) / 180;
  
  const y = Math.sin(kaabaLngRad - lngRad);
  const x = Math.cos(latRad) * Math.tan(kaabaLatRad) -
            Math.sin(latRad) * Math.cos(kaabaLngRad - lngRad);
  
  let qibla = Math.atan2(y, x) * (180 / Math.PI);
  qibla = (qibla + 360) % 360;
  
  return Math.round(qibla * 100) / 100;
}

function getCompassDirection(degrees) {
  const directions = [
    { name: 'N', nameAr: 'شمال', min: 337.5, max: 360 },
    { name: 'N', nameAr: 'شمال', min: 0, max: 22.5 },
    { name: 'NE', nameAr: 'شمال شرق', min: 22.5, max: 67.5 },
    { name: 'E', nameAr: 'شرق', min: 67.5, max: 112.5 },
    { name: 'SE', nameAr: 'جنوب شرق', min: 112.5, max: 157.5 },
    { name: 'S', nameAr: 'جنوب', min: 157.5, max: 202.5 },
    { name: 'SW', nameAr: 'جنوب غرب', min: 202.5, max: 247.5 },
    { name: 'W', nameAr: 'غرب', min: 247.5, max: 292.5 },
    { name: 'NW', nameAr: 'شمال غرب', min: 292.5, max: 337.5 }
  ];
  
  for (const dir of directions) {
    if (degrees >= dir.min && degrees < dir.max) {
      return { name: dir.name, nameAr: dir.nameAr };
    }
  }
  return { name: 'N', nameAr: 'شمال' };
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

module.exports = router;