import type { PageLoad } from './$types';
import type { ZoneWithBikeCount } from '$lib/types/ZoneWithBikeCount';
import type { ZonePolygonFeature } from '$lib/types/ZonePolygonFeature';
import type { Bike } from '$lib/types/Bike';
import type { BikePointFeature } from '$lib/types/BikePointFeature';
import type { City } from '$lib/types/City';
import type { CityPolygonFeature } from '$lib/types/CityPolygonFeature';

export const load: PageLoad = async ({ data }) => {
	return {
		zones: await (<ZonePolygonFeature[]>data.zones.map((zone: ZoneWithBikeCount) => {
			return {
				type: 'Feature',
				geometry: zone.geometry,
				properties: {
					descr: zone.descr,
					city_id: zone.city_id,
					id: zone.id,
					zone_id: zone.zone_id,
					bike_count: zone.bike_count,
					bikes: zone.bikes
				}
			};
		})),
		bikes: await (<BikePointFeature[]>data.bikes.map((bike: Bike) => {
			return {
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: bike.coords
				},
				properties: {
					id: bike.id,
					city_id: bike.city_id,
					charge_perc: bike.charge_perc,
					active: bike.active,
					status_id: bike.status_id,
					status_descr: bike.status_descr
				}
			};
		})),
		cities: await (<CityPolygonFeature[]>data.cities.map((city: City) => {
			return {
				type: 'Feature',
				geometry: city.geometry,
				properties: { name: city.name, id: city.id }
			};
		}))
	};
};
