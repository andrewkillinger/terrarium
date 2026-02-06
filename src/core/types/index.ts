export type EventMap = Record<string, unknown>;

export interface SimTickPayload {
  tick: number;
  elapsedMs: number;
  deltaMs: number;
}

export interface SimStatePayload {
  tick: number;
  elapsedMs: number;
  paused: boolean;
}

export type SimCommandAction = 'pause' | 'resume' | 'step' | 'reset';

export interface SimCommandPayload {
  action: SimCommandAction;
}

export interface CoreEvents extends EventMap {
  'devpanel:toggle': boolean | undefined;
  'sim:tick': SimTickPayload;
  'sim:state': SimStatePayload;
  'sim:command': SimCommandPayload;
  'spawn:request': SpawnRequestPayload;
  'spawn:clear': undefined;
}

export interface SpawnRequestPayload {
  kind: 'dot' | 'label';
  x: number;
  y: number;
  radius?: number;
  color?: number;
  text?: string;
  size?: number;
  ttl?: number;
}

declare global {
  interface ImportMetaEnv {
    readonly ASSET_BASE_URL?: string;
  }
}

export {};
