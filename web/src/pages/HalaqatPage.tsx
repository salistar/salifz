import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { halaqaAPI } from '../services/api';

interface Halaqa {
  _id: string;
  name: string;
  description?: string;
  memberCount?: number;
  inviteCode?: string;
}

const unwrapList = (response: any): Halaqa[] => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  return payload?.halaqat ?? payload?.items ?? [];
};

export default function HalaqatPage() {
  const [mine, setMine] = useState<Halaqa[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setMine(unwrapList(await halaqaAPI.mine()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    try {
      await halaqaAPI.create({ name: name.trim(), description: '', isPublic: true });
      setName('');
      setNotice('Halaqa créée');
      load();
    } catch (e: any) {
      setNotice(e?.error ?? 'Création impossible');
    }
  };

  const join = async () => {
    if (!code.trim()) return;
    try {
      await halaqaAPI.joinByCode(code.trim().toUpperCase());
      setCode('');
      setNotice('Vous avez rejoint la halaqa');
      load();
    } catch (e: any) {
      setNotice(e?.error ?? 'Code invalide');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Halaqat</h1>

      {notice && (
        <div className="card" role="status" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)' }}>
          {notice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <div className="card" style={{ display: 'grid', gap: 8 }}>
          <strong>Créer une halaqa</strong>
          <input
            placeholder="Nom de la halaqa"
            aria-label="Nom de la halaqa"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn-primary" onClick={create} disabled={!name.trim()}>
            Créer
          </button>
        </div>

        <div className="card" style={{ display: 'grid', gap: 8 }}>
          <strong>Rejoindre avec un code</strong>
          <input
            placeholder="Code d’invitation"
            aria-label="Code d’invitation"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={10}
          />
          <button className="btn-primary" onClick={join} disabled={!code.trim()}>
            Rejoindre
          </button>
        </div>
      </div>

      <h2 style={{ margin: '8px 0 0', fontSize: 18 }}>Mes halaqat</h2>

      {loading ? (
        <p>Chargement…</p>
      ) : mine.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          Aucune halaqa pour l’instant. Créez-en une ou rejoignez celle de votre enseignant.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {mine.map((h) => (
            <Link key={h._id} to={`/halaqa/${h._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 22,
                    background: 'var(--primary)', color: 'var(--on-deep)',
                    display: 'grid', placeItems: 'center', fontWeight: 700,
                  }}
                >
                  {h.name?.[0]?.toUpperCase() ?? 'H'}
                </div>
                <div style={{ flex: 1 }}>
                  <strong>{h.name}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {h.description || 'Groupe d’étude'}
                    {h.memberCount ? ` · ${h.memberCount} membre(s)` : ''}
                  </div>
                </div>
                <span aria-hidden>›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
