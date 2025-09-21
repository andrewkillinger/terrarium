import { ASSET_BASE_URL } from '@/core/config';

const PLACEHOLDER_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\//i;

export class AssetService {
  constructor(private readonly baseUrl: string) {}

  getBaseUrl(): string {
    return this.baseUrl;
  }

  resolve(path: string): string {
    if (!path) {
      throw new Error('Asset path must be provided');
    }

    if (ABSOLUTE_URL_PATTERN.test(path) || path.startsWith('data:')) {
      return path;
    }

    const normalizedBase = this.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');

    if (!normalizedBase) {
      return normalizedPath;
    }

    return `${normalizedBase}/${normalizedPath}`;
  }

  placeholderPixel(): string {
    return PLACEHOLDER_PIXEL;
  }
}

export const assetService = new AssetService(ASSET_BASE_URL);
