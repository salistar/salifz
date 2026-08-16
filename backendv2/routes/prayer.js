/**
 * Prayer & Qibla Routes - Salifz
 * ✅ FIXED: Returns data in format expected by frontend
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
      school = 0   // 0 = Shafi, 1 = Hanafi
    } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const cacheKey = `prayer:${latitude}:${longitude}:${method}`;
    const cached = prayerCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[Prayer] Returning cached data');
      return res.json(cached.data);
    }
    
    console.log(`[Prayer] Fetching times for ${latitude}, ${longitude}`);
    
    const response = await axios.get(`${ALADHAN_API}/timings`, {
      params: { latitude, longitude, method, school },
      timeout: 10000
    });
    
    if (response.data?.code === 200 && response.data?.data?.timings) {
      const aladhanData = response.data.data;
      const timings = aladhanData.timings;
      const dateInfo = aladhanData.date;
      
      // ✅ FIXED: Return in BOTH formats for compatibility
      const result = {
        success: true,
        data: {
          // Format 1: timings with capital letters (Aladhan format)
          timings: {
            Fajr: timings.Fajr,
            Sunrise: timings.Sunrise,
            Dhuhr: timings.Dhuhr,
            Asr: timings.Asr,
            Maghrib: timings.Maghrib,
            Isha: timings.Isha,
            Imsak: timings.Imsak,
            Midnight: timings.Midnight
          },
          // Format 2: times with lowercase (alternative format)
          times: {
            fajr: timings.Fajr,
            sunrise: timings.Sunrise,
            dhuhr: timings.Dhuhr,
            asr: timings.Asr,
            maghrib: timings.Maghrib,
            isha: timings.Isha
          },
          // Date info
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
          // Next prayer calculation
          nextPrayer: calculateNextPrayer(timings),
          // Meta info
          meta: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            timezone: aladhanData.meta?.timezone,
            method: aladhanData.meta?.method?.name
          }
        }
      };
      
      // Cache the result
      prayerCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      console.log('[Prayer] Returning fresh data');
      return res.json(result);
    }
    
    // Fallback if Aladhan returns unexpected format
    throw new Error('Invalid response from Aladhan API');
    
  } catch (error) {
    console.error('[Prayer] Error:', error.message);
    
    // ✅ Return default times on error (don't crash)
    const defaultTimes = getDefaultPrayerTimes(
      parseFloat(req.query.latitude) || 33.45,
      parseFloat(req.query.longitude) || -7.65
    );
    
    return res.json({
      success: true,
      data: {
        timings: defaultTimes,
        times: {
          fajr: defaultTimes.Fajr,
          sunrise: defaultTimes.Sunrise,
          dhuhr: defaultTimes.Dhuhr,
          asr: defaultTimes.Asr,
          maghrib: defaultTimes.Maghrib,
          isha: defaultTimes.Isha
        },
        date: getDefaultDateInfo(),
        nextPrayer: calculateNextPrayer(defaultTimes),
        fallback: true
      }
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
    
    // Try Aladhan API first
    try {
      const response = await axios.get(
        `${ALADHAN_API}/qibla/${latitude}/${longitude}`,
        { timeout: 5000 }
      );
      
      if (response.data?.data?.direction) {
        const direction = response.data.data.direction;
        return res.json({
          success: true,
          data: {
            direction: Math.round(direction * 100) / 100,
            compassDirection: getCompassDirection(direction),
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            kaaba: { latitude: 21.4225, longitude: 39.8262 },
            distanceToMecca: calculateDistance(
              parseFloat(latitude),
              parseFloat(longitude),
              21.4225,
              39.8262
            )
          }
        });
      }
    } catch (apiError) {
      console.log('[Qibla] Aladhan API failed, using local calculation');
    }
    
    // Fallback to local calculation
    const direction = calculateQiblaDirection(
      parseFloat(latitude),
      parseFloat(longitude)
    );
    
    return res.json({
      success: true,
      data: {
        direction: direction,
        compassDirection: getCompassDirection(direction),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        kaaba: { latitude: 21.4225, longitude: 39.8262 },
        distanceToMecca: calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          21.4225,
          39.8262
        ),
        calculated: true
      }
    });
    
  } catch (error) {
    console.error('[Qibla] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MONTHLY CALENDAR
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
      params: { latitude, longitude, method, month, year },
      timeout: 15000
    });
    
    if (response.data?.data) {
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
      
      return res.json({ success: true, data: calendar });
    }
    
    throw new Error('Invalid calendar response');
    
  } catch (error) {
    console.error('[Prayer Calendar] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CALCULATION METHODS
// ============================================
router.get('/methods', async (req, res) => {
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
    const timeStr = (prayer.time || '00:00').split(' ')[0];
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
  const fajrTime = (timings.Fajr || '05:30').split(' ')[0];
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
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function getDefaultPrayerTimes(lat, lng) {
  // Approximate times for Casablanca area
  const baseHour = 6 + (lat - 33) * 0.05;
  const lngOffset = (lng + 7) / 15;
  
  const formatTime = (h) => {
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };
  
  return {
    Fajr: formatTime(baseHour - 0.5),
    Sunrise: formatTime(baseHour + 1),
    Dhuhr: formatTime(12.5 + lngOffset),
    Asr: formatTime(15.5 + lngOffset),
    Maghrib: formatTime(18.5 - (lat - 33) * 0.05),
    Isha: formatTime(20 - (lat - 33) * 0.05),
    Imsak: formatTime(baseHour - 0.7),
    Midnight: '00:00'
  };
}

function getDefaultDateInfo() {
  const now = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hijriMonths = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 
                       'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  
  // Approximate Hijri date (not accurate, just for fallback)
  const hijriYear = Math.floor((now.getFullYear() - 622) * 1.030684);
  const hijriMonth = now.getMonth();
  const hijriDay = now.getDate();
  
  return {
    readable: now.toDateString(),
    timestamp: Math.floor(now.getTime() / 1000).toString(),
    hijri: {
      date: `${hijriDay}-${hijriMonth + 1}-${hijriYear}`,
      day: String(hijriDay),
      month: hijriMonths[hijriMonth],
      monthAr: hijriMonths[hijriMonth],
      year: String(hijriYear)
    },
    gregorian: {
      date: `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`,
      day: String(now.getDate()),
      month: months[now.getMonth()],
      year: String(now.getFullYear()),
      weekday: weekdays[now.getDay()]
    }
  };
}

module.exports = router;