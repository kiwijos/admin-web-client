export interface ZonePolygonFeature {
	type: 'Feature';
	geometry: { type: string; coordinates: [number, number][][] };
	properties: {
		id: number;
		descr: string;
		city_id: string;
	};
}
