/**
 * Heures de prière et qibla — version web.
 *
 * La position ne quitte pas l'appareil au-delà de l'appel de calcul : elle
 * n'est ni enregistrée en base ni journalisée, conformément à ce qu'annonce
 * la politique de confidentialité.
 *
 * L'orientation de la boussole vient de `deviceorientation`, disponible sur
 * mobile et sur les portables équipés. Sans capteur, la direction reste
 * affichée en degrés depuis le nord — ce qui reste utilisable avec une
 * boussole classique.
 */

import { useCallback, useEffect, useState } from 'react';
import { prayerAPI } from '../services/api';
import { unwrap } from '../components/useResource';
import { IconeQibla } from '../components/Icones';

const PRAYERS = [
  ['fajr', 'Fajr'],
  ['sunrise', 'Lever'],
  ['dhuhr', 'Dhuhr'],
  ['asr', 'Asr'],
  ['maghrib', 'Maghrib'],
  ['isha', 'Isha'],
] as const;

export default function PrayerPage() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [times, setTimes] = useState<any>(null);
  const [qibla, setQibla] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n’est pas disponible dans ce navigateur.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setError('Position refusée. Les heures de prière en dépendent.');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    let alive = true;

    Promise.all([
      prayerAPI.times(coords.latitude, coords.longitude),
      prayerAPI.qibla(coords.latitude, coords.longitude),
    ])
      .then(([t, q]: any[]) => {
        if (!alive) return;
        setTimes(unwrap(t));
        const payload = unwrap(q);
        setQibla(payload?.direction ?? payload?.qibla ?? payload?.bearing ?? null);
      })
      .catch((e: any) => alive && setError(e?.error ?? 'Calcul impossible'))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [coords]);

  // Boussole : `webkitCompassHeading` sur iOS, `alpha` ailleurs.
  useEffect(() => {
    const onOrientation = (event: any) => {
      const value =
        typeof event.webkitCompassHeading === 'number'
          ? event.webkitCompassHeading
          : typeof event.alpha === 'number'
          ? 360 - event.alpha
          : null;
      if (value !== null) setHeading(value);
    };
    window.addEventListener('deviceorientation', onOrientation, true);
    return () => window.removeEventListener('deviceorientation', onOrientation, true);
  }, []);

  const nextPrayer = times?.nextPrayer;
  // La flèche pointe vers la qibla *relativement* à l'orientation courante.
  const rotation = qibla !== null ? qibla - (heading ?? 0) : 0;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, flex: 1 }}>Prière & Qibla</h1>
        <button className="btn-primary" onClick={locate} disabled={loading}>
          {loading ? 'Localisation…' : coords ? 'Actualiser' : 'Utiliser ma position'}
        </button>
      </div>

      {error && (
        <div className="card" role="alert" style={{ background: 'var(--error-soft)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {!coords && !error && (
        <p style={{ color: 'var(--text-secondary)' }}>
          Les heures de prière et la direction de la qibla se calculent à partir de votre position.
          Elle n’est ni enregistrée ni transmise à un tiers.
        </p>
      )}

      {times && (
        <>
          {nextPrayer && (
            <div
              className="card"
              style={{ background: 'var(--primary-dark)', color: 'var(--on-deep)', border: 'none' }}
            >
              <div style={{ opacity: 0.85, fontSize: 13 }}>Prochaine prière</div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>
                {nextPrayer.nameAr ?? nextPrayer.name} — {nextPrayer.time}
              </div>
              {nextPrayer.remaining && (
                <div style={{ opacity: 0.9 }}>
                  dans {nextPrayer.remaining.hours} h {nextPrayer.remaining.minutes} min
                </div>
              )}
            </div>
          )}

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {PRAYERS.map(([key, label]) => {
              const value = times.timings?.[key] ?? times[key];
              if (!value) return null;
              return (
                <div key={key} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
                </div>
              );
            })}
          </section>
        </>
      )}

      {qibla !== null && (
        <section className="card" style={{ display: 'grid', placeItems: 'center', gap: 10, padding: 24 }}>
          <strong>Direction de la qibla</strong>
          <div
            style={{
              width: 160, height: 160, borderRadius: 80,
              border: '3px solid var(--border)', position: 'relative',
              display: 'grid', placeItems: 'center',
            }}
            role="img"
            aria-label={`Qibla à ${Math.round(qibla)} degrés depuis le nord`}
          >
            <div
              style={{
                fontSize: 52,
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out',
              }}
            >
              <IconeQibla size={52} />
            </div>
            <span style={{ position: 'absolute', top: 6, color: 'var(--text-muted)', fontSize: 12 }}>N</span>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>
            {Math.round(qibla)}° depuis le nord
            {heading === null && ' — aucune boussole détectée, orientez-vous au nord'}
          </span>
        </section>
      )}
    </div>
  );
}
