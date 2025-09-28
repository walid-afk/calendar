'use client';
import { Card, Button } from '@shopify/polaris';
import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import type { SlotOption } from '@/types';
import styles from './WeekSlots.module.css';

type Props = {
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  getSlotsForDay: (ymd: string) => Promise<SlotOption[]>;
  onPick: (slot: SlotOption) => void;
};

export default function WeekSlots({ weekStart, onPrevWeek, onNextWeek, getSlotsForDay, onPick }: Props) {
  const [days, setDays] = React.useState<{ ymd: string; label: string }[]>([]);
  const [slotsByDay, setSlotsByDay] = React.useState<Record<string, SlotOption[]>>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const start = dayjs(weekStart);
    const d: { ymd: string; label: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const di = start.add(i, 'day');
      d.push({
        ymd: di.format('YYYY-MM-DD'),
        label: `${di.format('dddd')} ${di.format('DD MMM')}`
      });
    }
    setDays(d);
  }, [weekStart]);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const rec: Record<string, SlotOption[]> = {};
      for (const d of days) {
        try { 
          rec[d.ymd] = await getSlotsForDay(d.ymd); 
        } catch { 
          rec[d.ymd] = []; 
        }
      }
      setSlotsByDay(rec);
      setLoading(false);
    })();
  }, [days, getSlotsForDay]);

  // Écouter l'événement de rafraîchissement après réservation
  React.useEffect(() => {
    const handleRefresh = () => {
      setLoading(true);
      (async () => {
        const rec: Record<string, SlotOption[]> = {};
        for (const d of days) {
          try { 
            rec[d.ymd] = await getSlotsForDay(d.ymd); 
          } catch { 
            rec[d.ymd] = []; 
          }
        }
        setSlotsByDay(rec);
        setLoading(false);
      })();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('refresh-slots', handleRefresh);
      return () => window.removeEventListener('refresh-slots', handleRefresh);
    }
  }, [days, getSlotsForDay]);

  return (
        <Card>
          <div className={styles.header}>
            <button className={styles.nav} onClick={onPrevWeek} aria-label="Semaine précédente">‹</button>
            <h3 className={styles.title}>2. Choix de la date & heure</h3>
            <div className={styles.headerActions}>
              <button 
                className={styles.refreshButton} 
                onClick={async () => {
                  setLoading(true);
                  // Recharger les créneaux
                  try {
                    const rec: Record<string, SlotOption[]> = {};
                    for (const d of days) {
                      try { 
                        rec[d.ymd] = await getSlotsForDay(d.ymd); 
                      } catch (error) { 
                        rec[d.ymd] = []; 
                        // Si erreur de connexion Google, déclencher l'UI de connexion
                        if (error && typeof error === 'object' && 'message' in error && 
                            String(error.message).includes('google_not_connected')) {
                          const event = new CustomEvent('google-connection-required');
                            if (typeof window !== 'undefined') {
                              window.dispatchEvent(event);
                            }
                        }
                      }
                    }
                    setSlotsByDay(rec);
                  } catch (error) {
                    // Erreur générale
                    console.error('Erreur lors du rafraîchissement:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                title="Actualiser les créneaux"
                aria-label="Actualiser les créneaux"
              >
                ↻
              </button>
              <button className={styles.nav} onClick={onNextWeek} aria-label="Semaine suivante">›</button>
            </div>
          </div>

      <div className={styles.grid}>
        {Array.isArray(days) && days.map((d) => (
          <div key={d.ymd} className={styles.col}>
            <div className={styles.colHeader}>
              <div className={styles.day}>{d.label}</div>
            </div>
                <div className={styles.colBody}>
                  {loading ? (
                    <div className={styles.placeholder}>Chargement…</div>
                  ) : (slotsByDay[d.ymd] || []).length > 0 ? (
                    Array.isArray(slotsByDay[d.ymd]) && slotsByDay[d.ymd].map((s, idx) => (
                      <button
                        key={idx}
                        className={styles.slot}
                        onClick={() => onPick(s)}
                        title={`${s.display} - ${s.employeeId ? 'Employé spécifique' : 'Sans préférence'}`}
                      >
                        {s.display}
                      </button>
                    ))
                  ) : (
                    <div className={styles.placeholder}>—</div>
                  )}
                </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
