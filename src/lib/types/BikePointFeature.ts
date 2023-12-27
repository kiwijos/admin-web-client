export interface BikePointFeature {
	type: 'Feature';
	geometry: { type: string; coordinates: [number, number] };
	properties: {
		id: string;
		battery_percentage: number;
	};
}
