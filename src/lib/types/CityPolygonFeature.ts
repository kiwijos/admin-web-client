export interface CityPolygonFeature {
	type: 'Feature';
	geometry: { type: string; coordinates: [number, number][][] };
	properties: {
		id: string;
		name: string;
	};
}
