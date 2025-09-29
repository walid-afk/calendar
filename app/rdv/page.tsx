'use client';
import React from 'react';
import { Page, Layout, Card, Banner, TextField, Button } from '@shopify/polaris';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import StaffPicker from '@/app/components/StaffPicker';
import WeekSlots from '@/app/components/WeekSlots';
import { getDaySlots } from '@/app/lib/availability';
import type { Employee, SlotOption } from '@/types';

export default function RDVPage() {
  const [passcode, setPasscode] = React.useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const headers = React.useMemo(() => passcode ? { 'x-passcode': passcode } : undefined, [passcode]);

  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [staff, setStaff] = React.useState<string>('any');
  const [totalMinutes, setTotalMinutes] = React.useState<number>(30);
  const [weekStart, setWeekStart] = React.useState<Date>(() => {
    const d = dayjs(); 
    const wd = d.day(); // 0 = dimanche
    const monday = d.subtract((wd + 6) % 7, 'day'); // ramener à lundi
    return monday.toDate();
  });

  // Authentification
  const handleAuth = async () => {
    if (passcode === '1234') {
      setIsAuthenticated(true);
      localStorage.setItem('passcode', passcode);
    } else {
      alert('Code d\'accès invalide');
    }
  };

  // Charger les employés
  React.useEffect(() => {
    if (!isAuthenticated) return;
    
    (async () => {
      try {
        const r = await fetch('/api/employees', { headers: headers || {}, cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json();
        const items = (j.items || []).map((it: any) => ({
          id: it.id, 
          label: it.label, 
          avatarUrl: it.avatarUrl, 
          pronoun: it.pronoun
        })) as Employee[];
        setEmployees(items);
      } catch (error) {
        console.error('Erreur lors du chargement des employés:', error);
      }
    })();
  }, [headers, isAuthenticated]);

  // getSlotsForDay à passer au composant
  const getSlotsForDay = React.useCallback(async (ymd: string) => {
    if (employees.length === 0 || totalMinutes <= 0) return [];
    try {
      const slots = await getDaySlots(ymd, employees, totalMinutes, staff, headers || {});
      return slots;
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      return [];
    }
  }, [employees, totalMinutes, staff, headers]);

  function onPrevWeek() { 
    setWeekStart((d) => dayjs(d).subtract(7,'day').toDate()); 
  }
  
  function onNextWeek() { 
    setWeekStart((d) => dayjs(d).add(7,'day').toDate()); 
  }

  function onPick(slot: SlotOption) {
    // si staff === 'any', on a slot.employeeId => l'utiliser pour book
    const chosenEmployee = staff === 'any' ? slot.employeeId! : staff;
    console.log('Choisi:', { start: slot.start, end: slot.end, calendarId: chosenEmployee });
    alert(`Créneau sélectionné: ${slot.display}\nEmployé: ${chosenEmployee}`);
    // ici tu peux ouvrir la modale de confirmation ou lancer /api/book
  }

  if (!isAuthenticated) {
    return (
      <Page title="Prise de RDV - Authentification">
        <Card>
          <div style={{ padding: '16px' }}>
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <TextField
              label="Code d'accès"
              value={passcode}
              onChange={setPasscode}
              type="password"
              placeholder="Entrez votre code d'accès"
              autoComplete="current-password"
            />
            <div style={{ marginTop: '16px' }}>
              <Button variant="primary" onClick={handleAuth} disabled={!passcode.trim()}>
                Se connecter
              </Button>
            </div>
          </div>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Prise de RDV">
      {Object.keys(headers || {}).length === 0 && (
        <Banner tone="warning">Entre ton passcode pour activer les appels API (x-passcode).</Banner>
      )}
      
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Avec qui ?</h3>
              <StaffPicker employees={employees} value={staff} onChange={setStaff} />
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Configuration</h3>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <TextField
                label="Durée (minutes)"
                type="number"
                value={totalMinutes.toString()}
                onChange={(value) => setTotalMinutes(parseInt(value) || 30)}
                min={15}
                step={15}
                autoComplete="off"
              />
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Employé sélectionné: {staff === 'any' ? 'Sans préférence' : staff}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {employees.length} employé{employees.length > 1 ? 's' : ''} chargé{employees.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <WeekSlots
            weekStart={weekStart}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
            getSlotsForDay={getSlotsForDay}
            onPick={onPick}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
