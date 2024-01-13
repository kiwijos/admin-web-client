<script lang="ts">
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import type { PageData } from './$types';
	import type { City } from '$lib/types/City';
	import type { Zone } from '$lib/types/Zone';
	import type { CityPolygonFeature } from '$lib/types/CityPolygonFeature';
	import type { ZonePolygonFeature } from '$lib/types/ZonePolygonFeature';

	import Map from '$lib/components/Map.svelte';
	import maplibregl from 'maplibre-gl';
	import { mapStore } from '$lib/stores/map';
	import { PUBLIC_MAPTILER_API_KEY } from '$env/static/public';

	import { ProgressRadial } from '@skeletonlabs/skeleton';

	export let data: PageData;

	// Get the map from the store
	let map: MaplibreMap;
	mapStore.subscribe((value) => {
		map = value;
	});

	let loading = true; // used to show a loading indicator while we add the sources and layers to the map

	const cityMaxZoom = 11;

	const zoneOptions: {
		[key: string]: { fill_color: string; label: string; line_color: string; minZoom: number };
	} = {
		parking: {
			fill_color: '#0ea5e9',
			label: 'Parkering',
			line_color: '#0c4a6e',
			minZoom: cityMaxZoom
		},
		charging: {
			fill_color: '#10b981',
			label: 'Laddning',
			line_color: '#064e3b',
			minZoom: cityMaxZoom
		},
		forbidden: {
			fill_color: '#ef4444',
			label: 'Förbjuden',
			line_color: '#7f1d1d',
			minZoom: cityMaxZoom
		}
	};

	$: if (map) {
		map.on('load', () => {
			// Extract coordinates for each city
			const coordinates: [number, number][][][] = data.cities.map((city: City) => {
				return city.geometry.coordinates;
			});

			// Fit the map to the bounds of all cities so they are all visible on the map when it loads
			const bounds = coordinates.reduce(
				(acc, polygon) => {
					const polygonBounds = polygon.reduce(
						(innerAcc, coord) => {
							coord.forEach((point) => {
								innerAcc.extend(point);
							});
							return innerAcc;
						},
						new maplibregl.LngLatBounds(polygon[0][0], polygon[0][0])
					);

					acc.extend(polygonBounds);
					return acc;
				},
				new maplibregl.LngLatBounds(coordinates[0][0][0], coordinates[0][0][0])
			);

			map.fitBounds(bounds, {
				padding: 40
			});

			///////// ADD CITY SOURCES AND LAYERS //////////
			const cityFeatures: CityPolygonFeature[] = data.cities.map((city: City) => {
				return {
					type: 'Feature',
					geometry: {
						type: city.geometry.type,
						coordinates: city.geometry.coordinates
					},
					properties: { name: city.name, id: city.id }
				};
			});

			map.addSource('cities', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: cityFeatures
				}
			});

			cityFeatures.forEach((feature: CityPolygonFeature) => {
				const cityId: string = feature.properties['id'];
				const fillLayerId = `${cityId}-fill`;

				// Add a layer for this city if it hasn't been added already.
				if (!map.getLayer(fillLayerId)) {
					map.addLayer({
						id: fillLayerId,
						type: 'fill',
						source: 'cities',
						maxzoom: cityMaxZoom,
						layout: {},
						paint: {
							'fill-color': '#6366f1',
							'fill-opacity': ['interpolate', ['linear'], ['zoom'], 1, 1, cityMaxZoom, 0]
						},
						filter: ['==', 'id', cityId]
					});

					// When a click event occurs on a feature in the cities (fill) layer, fly to the point
					map.on('click', fillLayerId, (e) => {
						// fly to the city if map is zoomed out
						if (map.getZoom() < cityMaxZoom) {
							map.flyTo({
								center: e.lngLat,
								zoom: cityMaxZoom
							});
						}
					});

					// Change the cursor to a pointer when the mouse is over the layer.
					map.on('mouseenter', fillLayerId, () => {
						map.getCanvas().style.cursor = 'pointer';
					});

					// Change it back to a pointer when it leaves.
					map.on('mouseleave', fillLayerId, () => {
						map.getCanvas().style.cursor = '';
					});
				}

				const borderLayerId = `${cityId}-border`;

				// Add a layer for this city if it hasn't been added already.
				if (!map.getLayer(borderLayerId)) {
					map.addLayer({
						id: borderLayerId,
						type: 'line',
						source: 'cities',
						layout: {},
						paint: {
							'line-color': '#4f46e5',
							'line-width': 3
						},
						filter: ['==', 'id', cityId]
					});
				}
			});

			///////// ADD ZONE SOURCES AND LAYERS //////////
			const zoneFeatures: ZonePolygonFeature[] = data.zones.map((zone: Zone) => {
				return {
					type: 'Feature',
					geometry: {
						type: zone.geometry.type,
						coordinates: zone.geometry.coordinates
					},
					properties: { zone_type: zone.descr, city_id: zone.city_id }
				};
			});

			const zoneFeatureCollection = {
				type: 'FeatureCollection',
				features: zoneFeatures
			};

			map.addSource('zones', {
				type: 'geojson',
				data: zoneFeatureCollection
			});

			// Insert the zone layers beneath any symbol layer with a "text-field" property.
			const layers = map.getStyle().layers;

			let labelLayerId: string;
			for (let i = 0; i < layers.length; i++) {
				// @ts-expect-error - we are aware that it might be undefined
				if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
					labelLayerId = layers[i].id;
					break;
				}
			}

			zoneFeatureCollection.features.forEach((feature: ZonePolygonFeature) => {
				const zoneType: string = feature.properties['zone_type'];
				const cityId: string = feature.properties['city_id'];
				const fillLayerID = `${cityId}-${zoneType}-fill`;

				// Add a layer for this type (parking/charging/forbidden) if it hasn't been added already.
				if (!map.getLayer(fillLayerID)) {
					map.addLayer(
						{
							id: fillLayerID,
							type: 'fill',
							minzoom: zoneOptions[zoneType].minZoom,
							source: 'zones',
							layout: {},
							paint: {
								// 'fill-pattern': zoneOptions[zoneType].pattern,
								'fill-color': zoneOptions[zoneType].fill_color,
								'fill-opacity': 0.5,
								'fill-outline-color': '#ffffff'
							},
							filter: ['all', ['==', 'zone_type', zoneType], ['==', 'city_id', cityId]]
						},
						labelLayerId // insert before the label layer id
					);
				}

				const borderLayerId = `${cityId}-${zoneType}-border`;

				// Add a layer for this city if it hasn't been added already.
				if (!map.getLayer(borderLayerId)) {
					map.addLayer({
						id: borderLayerId,
						type: 'line',
						minzoom: zoneOptions[zoneType].minZoom,
						source: 'zones',
						layout: {},
						paint: {
							'line-color': zoneOptions[zoneType].line_color,
							'line-width': 1
						},
						filter: ['all', ['==', 'zone_type', zoneType], ['==', 'city_id', cityId]]
					});
				}

				// Add a layer for the zone type's symbol if it hasn't been added already.
				const symbolLayerID = `${cityId}-${zoneType}-symbol`;

				if (!map.getLayer(symbolLayerID)) {
					map.addLayer({
						id: symbolLayerID,
						type: 'symbol',
						minzoom: zoneOptions[zoneType].minZoom,
						source: 'zones',
						layout: {
							'icon-allow-overlap': true,
							'text-field': zoneOptions[zoneType].label,
							'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
							'text-size': 9,
							'text-transform': 'uppercase'
						},
						paint: {
							'text-color': zoneOptions[zoneType].line_color
						},
						filter: ['all', ['==', 'zone_type', zoneType], ['==', 'city_id', cityId]]
					});
				}
			});

			///////// ADD 3D BUILDING SOURCES AND LAYERS //////////

			map.addSource('openmaptiles', {
				url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${PUBLIC_MAPTILER_API_KEY}`,
				type: 'vector'
			});

			map.addLayer(
				{
					id: '3d-buildings',
					source: 'openmaptiles',
					'source-layer': 'building',
					type: 'fill-extrusion',
					minzoom: 15,
					paint: {
						'fill-extrusion-color': [
							'interpolate',
							['linear'],
							['get', 'render_height'],
							0,
							'lightgray',
							200,
							'royalblue',
							400,
							'lightblue'
						],
						'fill-extrusion-height': [
							'interpolate',
							['linear'],
							['zoom'],
							15,
							0,
							16,
							['get', 'render_height']
						],
						'fill-extrusion-base': [
							'case',
							['>=', ['get', 'zoom'], 16],
							['get', 'render_min_height'],
							0
						]
					}
				},
				// @ts-expect-error - the labelLayerId is in fact defined
				labelLayerId
			);

			loading = false;
		});
	}
</script>

{#if loading}
	<div
		class="relative rounded-none w-full h-full z-[11] bg-surface-50 dark:bg-surface-500 flex justify-center items-center"
	>
		<ProgressRadial stroke={50} meter="stroke-primary-500" track="stroke-primary-900/30" />
	</div>
{/if}

<Map />
