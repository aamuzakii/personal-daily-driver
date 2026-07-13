import React from 'react';

import nawaqidul from '@/assets/json/nawaqidul-islam.json';
import LearnList from '@/components/learn-list';

export default function NawaqidulIslamScreen() {
  const items = Array.isArray(nawaqidul) ? (nawaqidul as any[]) : [];
  return <LearnList items={items} title="Nawaqidul Islam" />;
}
