import React from 'react';

import shifat from '@/assets/json/shifat-shalat.json';
import LearnList from '@/components/learn-list';

export default function ShifatShalatPage() {
  const items = Array.isArray(shifat) ? (shifat as any[]) : [];
  return <LearnList items={items} title="Shifat Shalat" />;
}
