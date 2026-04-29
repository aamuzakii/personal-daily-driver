// Aggregate all JSON fragments for Tafsir Firanda into a single array
import d from './12.json';
import e from './18.json';
import f from './20.json';
import g from './22.json';
import a from './3-4.json';
import b from './7.json';
import c from './8-10.json';

const combined = [
  ...(Array.isArray(a) ? a : []),
  ...(Array.isArray(b) ? b : []),
  ...(Array.isArray(c) ? c : []),
  ...(Array.isArray(d) ? d : []),
  ...(Array.isArray(e) ? e : []),
  ...(Array.isArray(f) ? f : []),
  ...(Array.isArray(g) ? g : []),
];

export default combined;
