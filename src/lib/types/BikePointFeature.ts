export interface BikePointFeature {
	type: 'Feature';
	geometry: { type: string; coordinates: [number, number] };
	properties: {
		id: number;
		city_id: string;
		charge_perc: number;
		active: boolean;
		status_id?: number;
		status_descr?: string;
		cluster_id?: number;
		cluster?: boolean;
		point_count?: number;
	};
}
