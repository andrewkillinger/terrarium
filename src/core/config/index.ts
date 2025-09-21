export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 240;
export const ZOOM_FACTOR = 3;
export const BACKGROUND_COLOR = 0x1d1f21;

export const SCENES = {
  BOOT: 'GameBoot',
  PRELOAD: 'GamePreload',
  PLAY: 'GamePlay',
} as const;

export const DEBUG_SPRITE_KEY = 'debug-sprite';
export const DEBUG_SPRITE_PATH = 'sprites/debug-placeholder.png';

export const ASSET_BASE_URL = import.meta.env.ASSET_BASE_URL || '';
export const BASE_URL = import.meta.env.BASE_URL || '/';
