export interface ZonePolygonFeature {
	type: 'Feature';
	geometry: { type: string; coordinates: [number, number][][] };
	properties: {
		zone_type: string;
		city_id: string;
	};
}
