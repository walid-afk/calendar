'use client';
import { Card, Text, Button } from '@shopify/polaris';
import React from 'react';
import Image from 'next/image';
import styles from './StaffPicker.module.css';
import type { Employee } from '@/types';

type Props = {
  employees: Employee[];
  value: string; // 'any' | id
  onChange: (v: string) => void;
};

export default function StaffPicker({ employees, value, onChange }: Props) {
  return (
    <Card>
      <div className={styles.wrap}>
        <div
          role="radio"
          aria-checked={value === 'any'}
          tabIndex={0}
          className={`${styles.card} ${value === 'any' ? styles.selected : ''}`}
          onClick={() => onChange('any')}
          onKeyDown={(e) => e.key === 'Enter' && onChange('any')}
        >
          <div className={styles.initials}>?</div>
          <div className={styles.info}>
            <div className={styles.name}>Sans préférence</div>
          </div>
          <div className={styles.radio}>{value === 'any' ? '◉' : '○'}</div>
        </div>

        {Array.isArray(employees) && employees.map((e) => (
          <div
            key={e.id}
            role="radio"
            aria-checked={value === e.id}
            tabIndex={0}
            className={`${styles.card} ${value === e.id ? styles.selected : ''}`}
            onClick={() => onChange(e.id)}
            onKeyDown={(ev) => ev.key === 'Enter' && onChange(e.id)}
          >
            {e.avatarUrl ? (
              <Image src={e.avatarUrl} alt={e.label} width={36} height={36} className={styles.avatar} />
            ) : (
              <div className={styles.initials}>{e.label?.[0] || 'E'}</div>
            )}
            <div className={styles.info}>
              <div className={styles.name}>{e.label}</div>
              {e.pronoun && <div className={styles.pronoun}>Pronom {e.pronoun}</div>}
            </div>
            <div className={styles.radio}>{value === e.id ? '◉' : '○'}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
