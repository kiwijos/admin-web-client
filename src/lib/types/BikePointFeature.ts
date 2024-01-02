export interface BikePointFeature {
	type: 'Feature';
	geometry: { type: string; coordinates: [number, number] };
	properties: {
		id: number;
		city_id: string;
		charge_perc: number;
	};
}
