import React from 'react';

import data from '@/assets/json/tafsir-firanda.json';
import LearnList from '@/components/learn-list';

export default function TafsirFirandaPage() {
  const items = Array.isArray(data) ? (data as any[]) : [];
  return <LearnList items={items} title="Tafsir Firanda" />;
}
