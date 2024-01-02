export interface BikeLineFeature {
	type: 'Feature';
	geometry: {
		type: 'LineString';
		coordinates: [number, number][];
	};
	properties: {
		id: string;
	};
}
