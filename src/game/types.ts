export type StatKey = 'theChat' | 'ngoTinh' | 'khiVan' | 'miLuc' | 'giaCanh';
export type ItemKey = 'linhThao' | 'trucCoDan' | 'hoiNguyenDan' | 'coBao' | 'tinhThach' | 'tinhThanQuyet';
export type NumericKey = StatKey | 'tuVi' | 'linhThach' | 'danhVong' | 'daoTam' | 'sinhLuc' | 'theLuc';
export interface GameChoice {
  label: string;
  tip?: string;
  need?: Partial<Record<NumericKey,number>>;
  effect?: Partial<Record<NumericKey,number>>;
  itemEffect?: Partial<Record<ItemKey,number>>;
  sect?: string;
  flag?: string;
  probability?: number;
  success?: string;
  failure?: string;
  failEffect?: Partial<Record<NumericKey,number>>;
}
export interface StoryEvent {
  id: string;
  source?: string;
  age?: number;
  title: string;
  subtitle?: string;
  text: string;
  icon: string;
  kind: 'story' | 'trial' | 'encounter' | 'milestone';
  choices: GameChoice[];
  cond?: 'highFamily'|'lowFamily'|'normalFamily'|'sect'|'noSect'|'starPath';
}
export interface Talent {
  id: number; name: string; detail: string; tier: number;
  bonus?: Partial<Record<NumericKey,number>>;
}
export interface GameLog { age: number; title: string; content: string; type: 'story'|'action'|'realm'|'reward'|'danger'; }
export interface Cultivator {
  name: string; gender: 'Nam'|'Nữ'; origin: string;
  talents: number[]; theChat: number; ngoTinh: number; khiVan: number; miLuc: number; giaCanh: number;
  tuVi: number; linhThach: number; danhVong: number; daoTam: number;
  sinhLuc: number; theLuc: number; age: number; realm: number; sect: string; vocation: string;
  items: Record<ItemKey,number>; flags: string[]; seen: string[]; history: GameLog[];
  alive: boolean; completed: boolean;
}
export type Page = 'menhdo' | 'tuluyen' | 'tienduyen' | 'tongmon' | 'tui' | 'nhatky' | 'tulieu';
export interface GameSave { version: number; cultivator: Cultivator; pending: StoryEvent | null; lastOutcome: string; }
