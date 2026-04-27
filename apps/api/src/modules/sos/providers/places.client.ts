/**
 * Google Places (Legacy) Nearby Search — server-side only, never in the browser.
 * 1.5s per request; structured error logs, empty list on hard failure.
 */
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

const TIMEOUT_MS = 1500;

export interface NearestPlace {
  name: string;
  vicinity: string;
  lat: number;
  lng: number;
  mapsUrl: string;
}

interface NearbyRow {
  name: string;
  vicinity?: string;
  geometry: { location: { lat: number; lng: number } };
  place_id?: string;
}

function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toMapsUrl(p: { name: string; vicinity?: string; lat: number; lng: number }): string {
  const q = [p.name, p.vicinity || ''].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || `${p.lat},${p.lng}`)}`;
}

@Injectable()
export class GooglePlacesClient {
  private readonly logger = new Logger(GooglePlacesClient.name);
  private readonly key: string;

  constructor() {
    this.key = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.key) {
      this.logger.warn('GOOGLE_PLACES_API_KEY not set — Places calls will return empty (dev)');
    }
  }

  private baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

  private async searchOne(
    type: 'police' | 'hospital',
    lat: number,
    lng: number,
  ): Promise<NearestPlace[]> {
    if (!this.key) {
      return [];
    }
    const location = `${lat},${lng}`;
    const url = this.baseUrl;
    const started = Date.now();
    try {
      const { data } = await axios.get<{
        status: string;
        error_message?: string;
        results?: NearbyRow[];
      }>(url, {
        params: { location, radius: 3000, type, key: this.key },
        timeout: TIMEOUT_MS,
        validateStatus: () => true,
      });
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        this.logger.error(
          `Places ${type} non-OK status=${data.status} msg=${data.error_message} (${Date.now() - started}ms)`,
        );
        return [];
      }
      const rows: NearbyRow[] = data.results || [];
      const withDist = rows.map((r) => ({
        r,
        d: distKm(lat, lng, r.geometry.location.lat, r.geometry.location.lng),
      }));
      withDist.sort((a, b) => a.d - b.d);
      return withDist.slice(0, 3).map(({ r }) => ({
        name: r.name,
        vicinity: r.vicinity || '',
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
        mapsUrl: toMapsUrl({
          name: r.name,
          vicinity: r.vicinity,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        }),
      }));
    } catch (err) {
      const e = err as AxiosError;
      this.logger.error(
        `Places ${type} request failed: ${e.message} (code ${e.code}) (${Date.now() - started}ms)`,
      );
      return [];
    }
  }

  /** Nearest 3 police + 3 hospitals in parallel. Either leg may be empty; callers isolate failures. */
  async getPoliceAndHospitals(
    lat: number,
    lng: number,
  ): Promise<{ police: NearestPlace[]; hospitals: NearestPlace[] }> {
    const [police, hospitals] = await Promise.all([
      this.searchOne('police', lat, lng),
      this.searchOne('hospital', lat, lng),
    ]);
    this.logger.log(
      `Places nearby — police=${police.length} hospitals=${hospitals.length} (lat/lng ${lat},${lng})`,
    );
    return { police, hospitals };
  }
}
