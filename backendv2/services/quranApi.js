/**
 * Quran External API Service - Salifz
 * Uses free Quran.com and AlQuran.cloud APIs
 */

const axios = require('axios');

const QURAN_API = 'https://api.alquran.cloud/v1';
const QURAN_COM_API = 'https://api.quran.com/api/v4';

class QuranApiService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Get from cache or fetch
  async getCached(key, fetchFn) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // Get surah text with translation
  async getSurah(surahNumber, edition = 'quran-uthmani') {
    return this.getCached(`surah:${surahNumber}:${edition}`, async () => {
      try {
        const response = await axios.get(`${QURAN_API}/surah/${surahNumber}/${edition}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching surah:', error.message);
        return null;
      }
    });
  }

  // Get surah with translation
  async getSurahWithTranslation(surahNumber, translationEdition = 'en.sahih') {
    return this.getCached(`surah:${surahNumber}:translation:${translationEdition}`, async () => {
      try {
        const [arabic, translation] = await Promise.all([
          axios.get(`${QURAN_API}/surah/${surahNumber}/quran-uthmani`),
          axios.get(`${QURAN_API}/surah/${surahNumber}/${translationEdition}`)
        ]);
        
        return {
          surah: arabic.data.data,
          translation: translation.data.data
        };
      } catch (error) {
        console.error('Error fetching surah with translation:', error.message);
        return null;
      }
    });
  }

  // Get specific ayah
  async getAyah(surahNumber, ayahNumber, edition = 'quran-uthmani') {
    return this.getCached(`ayah:${surahNumber}:${ayahNumber}:${edition}`, async () => {
      try {
        const response = await axios.get(`${QURAN_API}/ayah/${surahNumber}:${ayahNumber}/${edition}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching ayah:', error.message);
        return null;
      }
    });
  }

  // Get audio URL for ayah (Quran.com API)
  async getAyahAudio(surahNumber, ayahNumber, reciterId = 7) {
    // Reciter IDs: 7=Mishary, 1=Abdul Basit, 5=Sudais
    const reciterMap = {
      'mishary': 7,
      'mishary_rashid': 7,
      'abdul_basit': 1,
      'sudais': 5,
      'shuraym': 6,
      'husary': 2,
      'minshawi': 3
    };
    
    const reciterIdNum = typeof reciterId === 'string' ? reciterMap[reciterId] || 7 : reciterId;
    const ayahKey = `${surahNumber}:${ayahNumber}`;
    
    return this.getCached(`audio:${ayahKey}:${reciterIdNum}`, async () => {
      try {
        const response = await axios.get(`${QURAN_COM_API}/recitations/${reciterIdNum}/by_ayah/${ayahKey}`);
        
        if (response.data.audio_files && response.data.audio_files.length > 0) {
          const audioFile = response.data.audio_files[0];
          return {
            url: `https://verses.quran.com/${audioFile.url}`,
            duration: audioFile.duration || null
          };
        }
        
        // Fallback to alternative API
        return {
          url: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${this.getAbsoluteAyahNumber(surahNumber, ayahNumber)}.mp3`,
          duration: null
        };
      } catch (error) {
        console.error('Error fetching audio:', error.message);
        // Fallback URL
        return {
          url: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${this.getAbsoluteAyahNumber(surahNumber, ayahNumber)}.mp3`,
          duration: null
        };
      }
    });
  }

  // Get word-by-word data (for tajweed highlighting)
  async getWordByWord(surahNumber, ayahNumber) {
    return this.getCached(`wbw:${surahNumber}:${ayahNumber}`, async () => {
      try {
        const response = await axios.get(`${QURAN_COM_API}/verses/by_key/${surahNumber}:${ayahNumber}`, {
          params: {
            words: true,
            word_fields: 'text_uthmani,text_indopak,translation'
          }
        });
        
        return response.data.verse?.words || [];
      } catch (error) {
        console.error('Error fetching word by word:', error.message);
        return [];
      }
    });
  }

  /**
   * Page du Mushaf de Médine (604 pages).
   *
   * C'est la vue par défaut de tous les concurrents et le repère mental des
   * hafiz : ils mémorisent la *position* des mots sur la page. L'application
   * n'avait aucune vue par page.
   *
   * Les mots sont renvoyés avec leur `line_number`, ce qui permet de
   * reproduire la mise en page réelle ligne par ligne plutôt que d'afficher
   * un bloc de texte continu.
   */
  async getPage(pageNumber) {
    const page = Number(pageNumber);
    if (!Number.isInteger(page) || page < 1 || page > 604) {
      const error = new Error('Numéro de page hors des 604 pages du Mushaf');
      error.status = 400;
      throw error;
    }

    return this.getCached(`page:${page}`, async () => {
      const response = await axios.get(`${QURAN_COM_API}/verses/by_page/${page}`, {
        params: {
          words: true,
          word_fields: 'text_uthmani,line_number,position,char_type_name',
          fields: 'text_uthmani,verse_key,juz_number,hizb_number,page_number',
          per_page: 50,
        },
        timeout: 10000,
      });

      const verses = (response.data?.verses || []).map((v) => ({
        verseKey: v.verse_key,
        surahNumber: Number(v.verse_key.split(':')[0]),
        ayahNumber: Number(v.verse_key.split(':')[1]),
        text: v.text_uthmani,
        juz: v.juz_number,
        hizb: v.hizb_number,
        words: (v.words || [])
          // `char_type_name === 'end'` est le rond de fin de verset : il porte
          // le numéro, pas un mot à mémoriser.
          .map((w) => ({
            position: w.position,
            line: w.line_number,
            text: w.text_uthmani || w.text,
            isEnd: w.char_type_name === 'end',
          })),
      }));

      // Regroupement par ligne pour un rendu fidèle au Mushaf imprimé.
      const lines = {};
      for (const verse of verses) {
        for (const word of verse.words) {
          const key = word.line || 0;
          (lines[key] = lines[key] || []).push({ ...word, verseKey: verse.verseKey });
        }
      }

      return {
        page,
        juz: verses[0]?.juz ?? null,
        hizb: verses[0]?.hizb ?? null,
        surahs: [...new Set(verses.map((v) => v.surahNumber))],
        verses,
        lines: Object.keys(lines)
          .map(Number)
          .sort((a, b) => a - b)
          .map((n) => ({ line: n, words: lines[n] })),
      };
    });
  }

  /** Page où commence une sourate — pour ouvrir le Mushaf au bon endroit. */
  async getPageForVerse(surahNumber, ayahNumber) {
    return this.getCached(`pageof:${surahNumber}:${ayahNumber}`, async () => {
      const response = await axios.get(
        `${QURAN_COM_API}/verses/by_key/${surahNumber}:${ayahNumber}`,
        { params: { fields: 'page_number' }, timeout: 8000 }
      );
      return response.data?.verse?.page_number ?? null;
    });
  }

  // Get juz data
  async getJuz(juzNumber) {
    return this.getCached(`juz:${juzNumber}`, async () => {
      try {
        const response = await axios.get(`${QURAN_API}/juz/${juzNumber}/quran-uthmani`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching juz:', error.message);
        return null;
      }
    });
  }

  // Search Quran
  async search(query, language = 'ar') {
    try {
      const edition = language === 'ar' ? 'quran-uthmani' : 'en.sahih';
      const response = await axios.get(`${QURAN_API}/search/${encodeURIComponent(query)}/${edition}`);
      return response.data.data;
    } catch (error) {
      console.error('Error searching Quran:', error.message);
      return { matches: [] };
    }
  }

  // Get available reciters
  async getReciters() {
    return this.getCached('reciters', async () => {
      try {
        const response = await axios.get(`${QURAN_COM_API}/resources/recitations`);
        return response.data.recitations || [];
      } catch (error) {
        console.error('Error fetching reciters:', error.message);
        // Return default list
        return [
          { id: 7, name: 'Mishary Rashid Alafasy', style: 'Murattal' },
          { id: 1, name: 'Abdul Basit Abdul Samad', style: 'Murattal' },
          { id: 5, name: 'Abdurrahman As-Sudais', style: 'Murattal' },
          { id: 6, name: 'Saud Al-Shuraim', style: 'Murattal' },
          { id: 2, name: 'Mahmoud Khalil Al-Husary', style: 'Murattal' }
        ];
      }
    });
  }

  // Helper: Get absolute ayah number for audio URLs
  getAbsoluteAyahNumber(surahNumber, ayahNumber) {
    // Cumulative ayah counts before each surah
    const ayahCounts = [0, 7, 293, 493, 669, 789, 954, 1160, 1235, 1364, 1473, 1596, 1707, 1750, 1802, 1901, 2029, 2140, 2250, 2348, 2483, 2595, 2673, 2791, 2855, 2932, 3159, 3252, 3340, 3409, 3469, 3503, 3533, 3606, 3660, 3705, 3788, 3970, 4058, 4133, 4218, 4272, 4325, 4414, 4473, 4510, 4545, 4583, 4612, 4630, 4675, 4735, 4784, 4846, 4901, 4979, 5075, 5104, 5126, 5150, 5163, 5177, 5188, 5199, 5217, 5229, 5241, 5271, 5323, 5375, 5419, 5447, 5475, 5495, 5551, 5591, 5622, 5672, 5712, 5758, 5800, 5829, 5848, 5884, 5909, 5931, 5948, 5967, 5993, 6023, 6043, 6058, 6079, 6090, 6098, 6106, 6125, 6130, 6138, 6146, 6157, 6168, 6176, 6179, 6188, 6193, 6197, 6204, 6207, 6213, 6221, 6225, 6230, 6236];
    
    return ayahCounts[surahNumber - 1] + ayahNumber;
  }
}

module.exports = new QuranApiService();