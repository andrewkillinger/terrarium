export type EventMap = Record<string, unknown>;

export interface TimeTickPayload {
  delta: number;
  elapsed: number;
  fixedStep: number;
  fps: number;
}

export interface CoreEvents extends EventMap {
  'debug:toggle': boolean | undefined;
  'time:tick': TimeTickPayload;
}

declare global {
  interface ImportMetaEnv {
    readonly ASSET_BASE_URL?: string;
  }
}

export {};
