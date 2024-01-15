import { PUBLIC_REST_API_URL } from '$env/static/public';

import type { LayoutServerLoad } from './$types';
import type { City } from '$lib/types/City';
import type { CityPolygonFeature } from '$lib/types/CityPolygonFeature';

export const load: LayoutServerLoad = async ({ fetch }) => {
	return {
		cities: <CityPolygonFeature[]>await fetch(`${PUBLIC_REST_API_URL}/cities`)
			.then((r) => r.json())
			.then((cities: City[]) => {
				return cities.map((city: City) => {
					return {
						type: 'Feature',
						geometry: city.geometry,
						properties: { name: city.name, id: city.id }
					};
				});
			})
	};
};
