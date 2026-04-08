import { Category, ElementDef, ElementId } from './types';
import { registerEmpty } from './rules/empty';
import { registerWall } from './rules/wall';
import { registerSand } from './rules/sand';
import { registerDirt } from './rules/dirt';
import { registerStone } from './rules/stone';
import { registerWood } from './rules/wood';
import { registerBrick } from './rules/brick';
import { registerMetal } from './rules/metal';
import { registerGlass } from './rules/glass';
import { registerIce } from './rules/ice';
import { registerWater } from './rules/water';
import { registerOil } from './rules/oil';
import { registerLava } from './rules/lava';
import { registerAcid } from './rules/acid';
import { registerSteam } from './rules/steam';
import { registerSmoke } from './rules/smoke';
import { registerFire } from './rules/fire';
import { registerSeed } from './rules/seed';
import { registerGrass } from './rules/grass';
import { registerVine } from './rules/vine';
import { registerTnt } from './rules/tnt';
import { registerGunpowder } from './rules/gunpowder';
import { registerDynamite } from './rules/dynamite';

export const ELEMENTS: ElementDef[] = new Array(ElementId.COUNT);

export function registerElement(def: ElementDef): void {
  ELEMENTS[def.id] = def;
}

let initialized = false;
export function initElements(): void {
  if (initialized) return;
  initialized = true;
  registerEmpty(registerElement);
  registerWall(registerElement);
  registerSand(registerElement);
  registerDirt(registerElement);
  registerStone(registerElement);
  registerWood(registerElement);
  registerBrick(registerElement);
  registerMetal(registerElement);
  registerGlass(registerElement);
  registerIce(registerElement);
  registerWater(registerElement);
  registerOil(registerElement);
  registerLava(registerElement);
  registerAcid(registerElement);
  registerSteam(registerElement);
  registerSmoke(registerElement);
  registerFire(registerElement);
  registerSeed(registerElement);
  registerGrass(registerElement);
  registerVine(registerElement);
  registerTnt(registerElement);
  registerGunpowder(registerElement);
  registerDynamite(registerElement);
  // Sanity check: every slot populated.
  for (let i = 0; i < ElementId.COUNT; i++) {
    if (!ELEMENTS[i]) {
      throw new Error(`ELEMENTS[${i}] missing`);
    }
  }
}

// Utility for UI to list elements by category.
export function elementsByCategory(cat: Category): ElementDef[] {
  const out: ElementDef[] = [];
  for (const el of ELEMENTS) if (el && el.category === cat) out.push(el);
  return out;
}
