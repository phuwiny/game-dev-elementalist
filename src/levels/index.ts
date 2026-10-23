import { GRAYBOX_LEVEL } from './graybox';
import { LAB_LEVEL } from './lab';

export interface LevelDef {
  key: string;
  name: string;
  rows: readonly string[];
}

export const LEVELS: readonly LevelDef[] = [
  { key: 'graybox', name: 'Graybox (Phase 1)', rows: GRAYBOX_LEVEL },
  { key: 'lab', name: 'Elements Lab (Phase 2)', rows: LAB_LEVEL },
];

export const DEFAULT_LEVEL = 'lab';

export function findLevel(key: string | undefined): LevelDef {
  return LEVELS.find((l) => l.key === key) ?? LEVELS.find((l) => l.key === DEFAULT_LEVEL) ?? LEVELS[0];
}
