<script lang="ts">
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import type { PageData } from './$types';

	import type { CityPolygonFeature } from '$lib/types/CityPolygonFeature';
	import type { ZonePolygonFeature } from '$lib/types/ZonePolygonFeature';

	import Map from '$lib/components/Map.svelte';
	import maplibregl from 'maplibre-gl';
	import { mapStore } from '$lib/stores/map';
	import { PUBLIC_MAPTILER_API_KEY } from '$env/static/public';

	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { createBikeCountPin, createBikePin } from '$lib/services/markerMaker';

	// @ts-expect-error - Don't bother
	import centerOfMass from '@turf/center-of-mass';

	export let data: PageData;

	// Get the map from the store
	let map: MaplibreMap;
	mapStore.subscribe((value) => {
		map = value;
	});

	let loading = true; // used to show a loading indicator while we add the sources and layers to the map

	const cityMaxZoom = 11;

	const zoneOptions: {
		[key: string]: { fill_color: string; label: string; line_color: string };
	} = {
		parking: {
			fill_color: '#0ea5e9',
			label: 'Parkering',
			line_color: '#0c4a6e'
		},
		charging: {
			fill_color: '#10b981',
			label: 'Laddning',
			line_color: '#064e3b'
		},
		forbidden: {
			fill_color: '#ef4444',
			label: 'Förbjuden',
			line_color: '#7f1d1d'
		}
	};

	$: if (map) {
		map.on('load', () => {
			if (!map.getSource('cities')) {
				map.addSource('cities', {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: data.cities
					}
				});
			}

			data.cities.forEach((feature: CityPolygonFeature) => {
				const cityId: string = feature.properties.id;
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
						// Fly to the city if the map is zoomed out beyond cityMaxZoom
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

					// Change it back to normal when it leaves.
					map.on('mouseleave', fillLayerId, () => {
						map.getCanvas().style.cursor = '';
					});
				}

				const borderLayerId = `${cityId}-border`;

				// Add a border if it hasn't been added already.
				if (!map.getLayer(borderLayerId)) {
					map.addLayer({
						id: borderLayerId,
						type: 'line',
						source: 'cities',
						layout: {},
						paint: {
							'line-color': '#4f46e5',
							'line-width': 2
						},
						filter: ['==', 'id', cityId]
					});
				}
			});

			if (!map.getSource('zones')) {
				map.addSource('zones', {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: data.zones }
				});
			}

			// Insert the zone layers beneath any symbol layer with a text-field property
			// Basically, make sure names of places and streets and other labels are always visible on top of zones
			const layers = map.getStyle().layers;

			let labelLayerId: string;
			for (let i = 0; i < layers.length; i++) {
				// @ts-expect-error - TS doesn't know about text-field
				if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
					labelLayerId = layers[i].id;
					break;
				}
			}

			data.zones.forEach((feature: ZonePolygonFeature) => {
				const zoneDescr: string = feature.properties.descr;
				const cityId: string = feature.properties.city_id;
				const fillLayerID = `${cityId}-${zoneDescr}-fill`;

				// Add a layer for this type (parking/charging/forbidden) if it hasn't been added already.
				if (!map.getLayer(fillLayerID)) {
					map.addLayer(
						{
							id: fillLayerID,
							type: 'fill',
							source: 'zones',
							layout: {},
							paint: {
								'fill-color': zoneOptions[zoneDescr].fill_color,
								'fill-opacity': ['interpolate', ['exponential', 2], ['zoom'], 10, 0, 13, 0.4]
							},
							filter: ['all', ['==', 'descr', zoneDescr], ['==', 'city_id', cityId]]
						},
						labelLayerId // <-- insert under text labels
					);
				}

				const borderLayerId = `${cityId}-${zoneDescr}-border`;

				// Add a layer for this city if it hasn't been added already.
				if (!map.getLayer(borderLayerId)) {
					map.addLayer(
						{
							id: borderLayerId,
							type: 'line',
							source: 'zones',
							layout: {},
							paint: {
								'line-color': zoneOptions[zoneDescr].line_color,
								'line-width': 2,
								'line-opacity': ['interpolate', ['exponential', 2], ['zoom'], 11, 0, 13, 0.9]
							},
							filter: ['all', ['==', 'descr', zoneDescr], ['==', 'city_id', cityId]]
						},
						labelLayerId // <-- insert under text labels
					);
				}

				// Add bike count pins for each zone.
				if (feature.properties?.bike_count) {
					const center = centerOfMass(feature).geometry.coordinates;

					const el: HTMLElement = createBikeCountPin(feature.properties.bike_count);

					new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -3] })
						.setLngLat(center)
						.addTo(map);
				}

				// Add zone labels if they haven't been added already.
				const symbolLayerID = `${cityId}-${zoneDescr}-symbol`;

				if (!map.getLayer(symbolLayerID)) {
					map.addLayer({
						id: symbolLayerID,
						type: 'symbol',
						source: 'zones',
						layout: {
							'icon-allow-overlap': true,
							'text-field': zoneOptions[zoneDescr].label,
							'text-font': ['Arial Unicode MS Bold'],
							'text-size': 12,
							'text-transform': 'uppercase'
						},
						paint: {
							'text-color': zoneOptions[zoneDescr].line_color,
							'text-halo-color': '#fff',
							'text-halo-width': 1,
							'text-opacity': ['interpolate', ['exponential', 2], ['zoom'], 11, 0, 13, 1]
						},
						filter: ['all', ['==', 'descr', zoneDescr], ['==', 'city_id', cityId]]
					});
				}
			});

			if (!map.getSource('openmaptiles')) {
				map.addSource('openmaptiles', {
					url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${PUBLIC_MAPTILER_API_KEY}`,
					type: 'vector'
				});
			}

			// Adapted from maplibre tutorial (https://maplibre.org/maplibre-gl-js/docs/examples/3d-buildings/)
			if (!map.getLayer('3d-buildings')) {
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
					// @ts-expect-error - The labelLayerId is defined, TS just doesn't know it.
					labelLayerId
				);
			}

			if (!map.getSource('bikes')) {
				map.addSource('bikes', {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: data.bikes
					},
					cluster: true,
					clusterMaxZoom: 15, // Max zoom to cluster points on
					clusterRadius: 30 // Radius of each cluster when clustering points (defaults to 50)
				});
			}

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
