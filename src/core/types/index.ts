export type EventMap = Record<string, unknown>;

export interface TimeTickPayload {
  delta: number;
  elapsed: number;
  fixedStep: number;
  fps: number;
}

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
  'time:tick': TimeTickPayload;
}

declare global {
  interface ImportMetaEnv {
    readonly ASSET_BASE_URL?: string;
  }
}

export {};
