'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { Page, Card, Banner, TextField, Button } from '@shopify/polaris';

function DiagInner() {
  // Tous les hooks en premier
  const [mounted, setMounted] = React.useState(false);
  const [who, setWho] = React.useState<any>(null);
  const [cals, setCals] = React.useState<any[]>([]);
  const [msg, setMsg] = React.useState<string>('');
  const [calendarId, setCalendarId] = React.useState('');
  const [date, setDate] = React.useState<string>('');      // init vide, on calcule après montage
  const [duration, setDuration] = React.useState('30');

  const [pass, setPass] = React.useState('');
  
  React.useEffect(() => {
    try { 
      setPass(localStorage.getItem('passcode') || ''); 
    } catch { 
      setPass(''); 
    }
  }, []);
  const headers = React.useMemo(() => pass ? { 'x-passcode': pass } : {}, [pass]);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    // init date = demain (en client uniquement)
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().slice(0,10));
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const w = await fetch('/api/google/whoami', { cache:'no-store' }).then(r=>r.json());
        setWho(w);
        const list = await fetch('/api/google/calendars/raw', { cache:'no-store' }).then(r=>r.json());
        setCals(list.items || []);
        if (list.items?.length) setCalendarId(list.items[0].id);
      } catch {
        setMsg('Impossible de lister les agendas. Reconnecte Google.');
      }
    })();
  }, []);

  // Condition de rendu après tous les hooks
  if (!mounted) return null; // évite tout rendu serveur → plus de mismatch

  async function testFreeBusy() {
    setMsg('Test en cours…');
    if (!calendarId || !date) { setMsg('calendarId et date requis.'); return; }
    const url = `/api/freebusy/test?calendarId=${encodeURIComponent(calendarId)}&date=${date}&durationMinutes=${encodeURIComponent(duration)}`;
    const res = await fetch(url, { cache:'no-store' }).then(r=>r.json()).catch(()=>null);
    if (!res) return setMsg('Erreur réseau.');
    setMsg(`Status ${res.status} — ${res.body?.meta?.reasons?.join(' • ') || res.body?.error || 'OK'} | validStarts=${res.body?.validStarts?.length || 0}`);
  }

  return (
    <Page title="Diagnostic Google">
      {!pass && <Banner>Ajoute ton passcode en localStorage : <code>localStorage.setItem('passcode','TONPASS')</code></Banner>}

      <Card>
        <div>Compte primaire (inféré)&nbsp;: <b>{who?.primaryEmail ?? 'inconnu'}</b></div>
        <div>Agendas trouvés&nbsp;: {cals.length}</div>
      </Card>

      <Card>
        <div style={{fontWeight: 'bold', marginBottom: '12px'}}>Agendas (id • label • rôle)</div>
        <ul style={{lineHeight:'1.8'}}>
          {cals.map((c:any) => (
            <li key={c.id}>
              <code style={{background:'#f3f4f6', padding:'2px 4px', borderRadius:4}}>{c.id}</code> • {c.summary} • <i>{c.accessRole}{c.primary?' (primary)':''}</i>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div style={{fontWeight: 'bold', marginBottom: '12px'}}>Tester FreeBusy</div>
        <div style={{display:'grid', gap:12, gridTemplateColumns:'1fr 160px 120px'}}>
          <TextField label="calendarId" value={calendarId} onChange={setCalendarId} autoComplete="off" />
          <TextField label="Date" type="date" value={date} onChange={setDate} autoComplete="off" />
          <TextField label="Durée (min)" value={duration} onChange={setDuration} autoComplete="off" />
        </div>
        <div style={{marginTop:12}}>
          <Button onClick={testFreeBusy}>Tester</Button>
        </div>
        {msg && <div style={{marginTop:12}}>{msg}</div>}
      </Card>
    </Page>
  );
}

// Exporter la page en désactivant le SSR (sécurité maximale contre la mismatch)
export default dynamic(() => Promise.resolve(DiagInner), { ssr: false });
