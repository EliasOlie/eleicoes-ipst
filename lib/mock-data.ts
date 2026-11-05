import { Member } from '@/types/election';

export const INITIAL_DIAC: [string, string, number][] = [
  ['d1', 'Armando', 3],
  ['d2', 'João Dácio', 3],
  ['d3', 'Jesus', 3],
  ['d4', 'Cícero', 3],
  ['d5', 'Hélio', 3],
];

export const INITIAL_PRESB: [string, string, number][] = [
  ['p1', 'Antônio Lopes', 3],
  ['p2', 'Reginaldo', 3],
  ['p3', 'Emanuel', 3],
  ['p4', 'Jonas', 3],
  ['p5', 'Cláudio', 3],
];

const FIRST = [
  'Maria', 'José', 'Ana', 'João', 'Francisca', 'Antônio', 'Josefa', 'Paulo',
  'Raimunda', 'Pedro', 'Luzia', 'Carlos', 'Rita', 'Marcos', 'Helena',
  'Severino', 'Joana', 'Lucas', 'Débora', 'Samuel'
];

const LAST = [
  'Silva', 'Ferreira', 'Lima', 'Souza', 'Alves', 'Nogueira', 'Pereira',
  'Barbosa', 'Rodrigues', 'Cavalcanti', 'Monteiro', 'Magalhães', 'Araújo',
  'Torres', 'Bezerra'
];

let seed = 42;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const pad = (n: number) => String(n).padStart(2, '0');

export function generateMembers(): Member[] {
  seed = 42; // deterministic reset
  const list: Member[] = [];
  for (let i = 0; i < 86; i++) {
    const fn = FIRST[Math.floor(rnd() * FIRST.length)];
    const ln1 = LAST[Math.floor(rnd() * LAST.length)];
    const ln2 = LAST[Math.floor(rnd() * LAST.length)];
    const name = `${fn} ${ln1} ${ln2}`;
    const d = () => Math.floor(rnd() * 10);
    const phone = `(87) 9 9${d()}${d()}${d()}-${d()}${d()}${d()}${d()}`;
    const mins = Math.floor(rnd() * 45);
    list.push({ id: i, name, phone, time: `19:${pad(mins)}` });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export function generateInitialCheck(members: Member[]): Record<number, boolean> {
  seed = 100;
  const check: Record<number, boolean> = {};
  members.forEach((m) => {
    if (rnd() < 0.9) check[m.id] = true;
  });
  return check;
}

export const TOTAL_COMUNGANTES = 300;
export const QUORUM_MINIMO = Math.ceil(TOTAL_COMUNGANTES * 0.5); // 50% = 150

export function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return 'IP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d[2]} ${d.slice(3)}`;
  return `(${d.slice(0, 2)}) ${d[2]} ${d.slice(3, 7)}-${d.slice(7)}`;
}

export function pickWeighted(list: [string, string, number][], k: number): string[] {
  const pool = list.slice();
  const out: string[] = [];
  for (let i = 0; i < k && pool.length; i++) {
    const total = pool.reduce((s, c) => s + c[2], 0);
    let r = Math.random() * total;
    let j = 0;
    while (r > pool[j][2] && j < pool.length - 1) {
      r -= pool[j][2];
      j++;
    }
    out.push(pool[j][0]);
    pool.splice(j, 1);
  }
  return out;
}
