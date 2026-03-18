export const DISH_SVGS = [
  {
    key: 'telor_goreng',
    color: 'rgba(250,204,21,0.95)',
    xml: `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 6c-10 0-18 10-18 24s8 28 18 28 18-14 18-28S42 6 32 6z" fill="rgba(255,255,255,0.92)"/>
  <path d="M32 10c-7.8 0-14 8.8-14 20.2C18 41.6 24.2 54 32 54s14-12.4 14-23.8C46 18.8 39.8 10 32 10z" fill="rgba(0,0,0,0.06)"/>
  <circle cx="34" cy="34" r="9" fill="currentColor"/>
  <circle cx="37" cy="31" r="3" fill="rgba(255,255,255,0.35)"/>
  <path d="M23 44c4 4 15 6 22 0" stroke="rgba(0,0,0,0.14)" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>`.trim(),
  },
  {
    key: 'telor_rebus',
    color: 'rgba(248,250,252,0.95)',
    xml: `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 8c-9.5 0-16 11.5-16 25 0 13.5 6.5 23 16 23s16-9.5 16-23C48 19.5 41.5 8 32 8z" fill="currentColor"/>
  <path d="M32 12c-7.2 0-12.5 9.6-12.5 20.3 0 10.8 5.3 19.7 12.5 19.7s12.5-8.9 12.5-19.7C44.5 21.6 39.2 12 32 12z" fill="rgba(0,0,0,0.08)"/>
  <path d="M26 24c3-4 9-4 12 0" stroke="rgba(255,255,255,0.35)" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M24 44c4 5 12 7 16 0" stroke="rgba(0,0,0,0.14)" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>`.trim(),
  },
  {
    key: 'ayam_goreng',
    color: 'rgba(245,158,11,0.95)',
    xml: `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
<path d="M60,140 Q40,110 50,80 Q70,40 110,50 Q150,60 140,100 Q130,130 110,140 L90,170 Q80,180 70,170 Q60,160 70,150 L85,135" fill="#C17817" stroke="#8B4513" stroke-width="2"/>

<circle cx="80" cy="80" r="3" fill="#A0522D" opacity="0.6"/>
<circle cx="110" cy="70" r="4" fill="#A0522D" opacity="0.6"/>
<circle cx="120" cy="100" r="2" fill="#A0522D" opacity="0.6"/>
<circle cx="95" cy="115" r="3" fill="#A0522D" opacity="0.6"/>
<path d="M75,95 Q85,100 80,110" fill="none" stroke="#D2691E" stroke-width="1.5" stroke-linecap="round"/>
<path d="M105,85 Q115,90 110,100" fill="none" stroke="#D2691E" stroke-width="1.5" stroke-linecap="round"/>

<path d="M100,60 Q120,65 125,85" fill="none" stroke="#FFD700" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
</svg>`.trim(),
  },
  {
    key: 'ayam_bakar',
    color: 'rgba(217,119,6,0.95)',
    xml: `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 38c0-10 8-18 18-18h6c7 0 12 5 12 12 0 10-10 18-22 18-8 0-14-5-14-12z" fill="currentColor"/>
  <path d="M20 30h24" stroke="rgba(0,0,0,0.22)" stroke-width="3" stroke-linecap="round"/>
  <path d="M18 36h28" stroke="rgba(0,0,0,0.22)" stroke-width="3" stroke-linecap="round"/>
  <path d="M20 42h24" stroke="rgba(0,0,0,0.22)" stroke-width="3" stroke-linecap="round"/>
  <path d="M14 44c2 6 9 10 18 10 13 0 24-9 24-20" stroke="rgba(0,0,0,0.18)" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>`.trim(),
  },
  {
    key: 'soto',
    color: 'rgba(16,185,129,0.95)',
    xml: `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 30h28c2 0 4 2 4 4 0 10-8 18-18 18S14 44 14 34c0-2 2-4 4-4z" fill="currentColor"/>
  <path d="M24 18c0 4 4 4 4 8" stroke="rgba(255,255,255,0.55)" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M34 18c0 4 4 4 4 8" stroke="rgba(255,255,255,0.55)" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M22 38h20" stroke="rgba(0,0,0,0.14)" stroke-width="3" stroke-linecap="round"/>
</svg>`.trim(),
  },
] as const;
