import { PUBLIC_REST_API_URL } from '$env/static/public';

import type { PageServerLoad } from './$types';
import type { Bike } from '$lib/types/Bike';
import type { ZoneWithBikeCount } from '$lib/types/ZoneWithBikeCount';

// @ts-expect-error - We don't have types for this yet
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

export const load: PageServerLoad = async ({ fetch }) => {
	const zones: ZoneWithBikeCount[] = await fetch(`${PUBLIC_REST_API_URL}/zones`).then((r) =>
		r.json()
	);
	const bikes: Bike[] = await fetch(`${PUBLIC_REST_API_URL}/bikes`).then((r) => r.json());

	// iterate over each bike and check if it's in a zone, if it is, add it to the zone's bikes array and remove it from the bikes array
	for (let i = 0; i < bikes.length; i++) {
		const bike = bikes[i];
		for (let j = 0; j < zones.length; j++) {
			const zone = zones[j];
			if (
				booleanPointInPolygon(bike.coords, zone.geometry) &&
				(bike.status_id !== 2 || bike.status_id !== 5)
			) {
				if (!zone.bikes) zone.bikes = [];
				if (!zone.bike_count) zone.bike_count = 0;
				zone.bike_count++;
				zone.bikes.push(bike);
				bikes.splice(i, 1);
				i--;
				break;
			}
		}
	}

	return {
		zones,
		bikes,
		cities: await fetch(`${PUBLIC_REST_API_URL}/cities`).then((r) => r.json())
	};
};
