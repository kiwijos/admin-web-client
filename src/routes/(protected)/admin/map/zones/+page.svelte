<script lang="ts">
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import type { PageData } from './$types';
	import type { City } from '$lib/types/City';
	import type { Zone } from '$lib/types/Zone';

	import Map from '$lib/components/Map.svelte';
	import maplibregl from 'maplibre-gl';
	import { mapStore } from '$lib/stores/map';
	import { PUBLIC_MAPTILER_API_KEY } from '$env/static/public';

	export let data: PageData;

	// Get the map from the store
	let map: MaplibreMap;
	mapStore.subscribe((value) => {
		map = value;
	});

	const zoneOptions: {
		[key: string]: { color: string; label: string; minZoom: number };
	} = {
		parking: { color: 'blue', label: 'Parkering', minZoom: 12 },
		charging: { color: 'green', label: 'Laddning', minZoom: 12 },
		forbidden: { color: 'red', label: 'Förbjuden', minZoom: 11 }
	};

	const cityZoom = 11;

	$: if (map) {
		map.on('load', () => {
			// extract coordinates for each city
			// @ts-expect-error - data is not typed but should look like this
			const coordinates: [number, number][][][] = data.cities.map((city) => {
				return city.geometry.coordinates;
			});

			// fit the map to the bounds of all cities
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
			const cityFeatures = data.cities.map((city: City) => {
				return {
					type: 'Feature',
					geometry: {
						type: city.geometry.type,
						coordinates: city.geometry.coordinates
					},
					properties: { name: city.name }
				};
			});

			map.addSource('cities', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: cityFeatures
				}
			});

			map.addLayer({
				id: 'city-fills',
				type: 'fill',
				source: 'cities',
				maxzoom: cityZoom,
				layout: {},
				paint: {
					'fill-color': '#627BC1',
					'fill-opacity': ['interpolate', ['linear'], ['zoom'], 1, 1, cityZoom, 0]
				}
			});

			map.addLayer({
				id: 'city-borders',
				type: 'line',
				source: 'cities',
				layout: {},
				paint: {
					'line-color': '#627BC1',
					'line-width': 3
				}
			});

			// When a click event occurs on a feature in the cities (fill) layer, fly to the point
			map.on('click', 'city-fills', (e) => {
				// fly to the city if map is zoomed out
				if (map.getZoom() < cityZoom) {
					map.flyTo({
						center: e.lngLat,
						zoom: cityZoom
					});
				}
			});

			// Change the cursor to a pointer when the mouse is over the layer.
			map.on('mouseenter', 'city-fills', () => {
				map.getCanvas().style.cursor = 'pointer';
			});

			// Change it back to a pointer when it leaves.
			map.on('mouseleave', 'city-fills', () => {
				map.getCanvas().style.cursor = '';
			});

			///////// ADD ZONE SOURCES AND LAYERS //////////
			const zoneFeatures = data.zones.map((zone: Zone) => {
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

			zoneFeatureCollection.features.forEach((feature) => {
				const zoneType: string = feature.properties['zone_type'];
				const fillLayerID = `${zoneType}-layer`;

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
								'fill-color': zoneOptions[zoneType].color,
								'fill-opacity': 0.5,
								'fill-outline-color': '#ffffff'
							},
							filter: ['==', 'zone_type', zoneType]
						},
						labelLayerId // insert before the label layer id
					);
				}

				// Add a layer for the zone type's symbol if it hasn't been added already.
				const symbolLayerID = `${zoneType}-symbol-layer`;
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
							'text-color': zoneOptions[zoneType].color
						},
						filter: ['==', 'zone_type', zoneType]
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
		});
	}
</script>

<Map />
