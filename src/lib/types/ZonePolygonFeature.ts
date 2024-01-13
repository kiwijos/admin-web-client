import type { Bike } from './Bike';

export interface ZonePolygonFeature {
	type: 'Feature';
	geometry: { type: string; coordinates: [number, number][][] };
	properties: {
		id: number;
		zone_id: number;
		bike_count?: number;
		bikes?: Bike[];
		descr: string;
		city_id: string;
	};
}
