import type { Bike } from './Bike';

export interface ZoneWithBikeCount {
	id: number;
	zone_id: number;
	descr: string;
	city_id: string;
	bike_count?: number;
	bikes?: Bike[];
	geometry: {
		type: string;
		coordinates: [number, number][][];
	};
}
