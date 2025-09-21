import { assetService } from '@/core/services/AssetService';

export type AssetManifest = {
  images?: Record<string, string>;
  atlases?: Record<string, { json: string; image: string }>;
  fonts?: Record<string, string>;
  version: string;
};

export class ManifestService {
  private manifest: AssetManifest | null = null;
  private inflight: Promise<AssetManifest | null> | null = null;
  private readonly manifestPath = 'manifest.json';
  private readonly crossOrigin = 'anonymous' as const;

  constructor(private readonly assets = assetService) {}

  async init(): Promise<AssetManifest | null> {
    if (this.manifest) {
      return this.manifest;
    }

    if (this.inflight) {
      return this.inflight;
    }

    this.inflight = this.fetchManifest();
    return this.inflight;
  }

  getManifest(): AssetManifest | null {
    return this.manifest;
  }

  getCrossOrigin(): 'anonymous' {
    return this.crossOrigin;
  }

  private async fetchManifest(): Promise<AssetManifest | null> {
    const url = this.resolveUrl(this.manifestPath);

    if (!url) {
      return null;
    }

    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        console.warn(`Asset manifest request failed with status ${response.status}`);
        return null;
      }

      const manifest = (await response.json()) as AssetManifest;
      this.manifest = this.resolveManifest(manifest);
      return this.manifest;
    } catch (error) {
      console.warn('Failed to load asset manifest', error);
      return null;
    }
  }

  private resolveManifest(manifest: AssetManifest): AssetManifest {
    const resolved: AssetManifest = {
      version: manifest.version,
    };

    if (manifest.images) {
      resolved.images = this.resolveRecord(manifest.images);
    }

    if (manifest.fonts) {
      resolved.fonts = this.resolveRecord(manifest.fonts);
    }

    if (manifest.atlases) {
      resolved.atlases = Object.entries(manifest.atlases).reduce<
        Record<string, { json: string; image: string }>
      >((accumulator, [key, value]) => {
        accumulator[key] = {
          json: this.resolveUrl(value.json) ?? value.json,
          image: this.resolveUrl(value.image) ?? value.image,
        };
        return accumulator;
      }, {});
    }

    return resolved;
  }

  private resolveRecord(record: Record<string, string>): Record<string, string> {
    return Object.entries(record).reduce<Record<string, string>>((accumulator, [key, path]) => {
      accumulator[key] = this.resolveUrl(path) ?? path;
      return accumulator;
    }, {});
  }

  private resolveUrl(path: string | undefined): string | null {
    if (!path) {
      return null;
    }

    try {
      return this.assets.resolve(path);
    } catch (error) {
      console.warn(`Failed to resolve asset path "${path}"`, error);
      return null;
    }
  }
}

export const manifestService = new ManifestService();
