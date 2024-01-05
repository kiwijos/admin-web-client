<script lang="ts">
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import Map from '$lib/components/Map.svelte';
	import { mapStore } from '$lib/stores/map';
	import type { ExpressionSpecification } from 'maplibre-gl';
	import maplibregl from 'maplibre-gl';
	import type { BikePointFeature } from '$lib/types/BikePointFeature';
	import {
		generatePointWithinRadius,
		generateRandomPointInSweden
	} from '$lib/services/pointGenerator';
	import { enhance } from '$app/forms';
	import { animateToPoint } from '$lib/services/animator';
	import type { PageData } from './$types';
	import type { Bike } from '$lib/types/Bike';

	export let data: PageData;

	let map: MaplibreMap;
	mapStore.subscribe((value) => (map = value));

	let selectedBikeFeature: BikePointFeature | null = null; // Bike in popup, if any

	// Define colors for battery levels
	const colors = {
		danger: 'rgb(210, 127, 129)',
		warning: 'rgb(228, 194, 94)',
		high: 'rgb(193, 221, 151)'
	};

	// Define expressions for battery levels used in layers
	const battery_danger: ExpressionSpecification = ['<', ['get', 'charge_perc'], 0.2];
	const battery_warning: ExpressionSpecification = [
		'all',
		['>=', ['get', 'charge_perc'], 0.2],
		['<', ['get', 'charge_perc'], 0.4]
	];
	const battery_high: ExpressionSpecification = ['>=', ['get', 'charge_perc'], 0.4];

	// Collect all bikes

	interface BikePoint {
		id: number;
		coords: [number, number];
		charge_perc: number;
	}

	// Define props for fake bikes
	const speedKmPerHour = 20;
	const speedMetersPerSecond = speedKmPerHour / 3.6;
	const updateInterval = 2000;
	const distancePerUpdate = speedMetersPerSecond * (updateInterval / 1000);

	let bikePointFeatures = data.bikes.map((bike: Bike) => {
		return {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: bike.coords
			},
			properties: {
				id: bike.id,
				charge_perc: bike.charge_perc,
				city_id: bike.city_id,
				active: bike.active
			}
		};
	});

	let updateBuffer: BikePoint[] = [];

	// Set a threshold for the batch size
	let BATCH_SIZE = 200;

	const updateBikePositionsBatched = (batch: BikePoint[]) => {
		console.log('Updating bike positions in batch', BATCH_SIZE);
		// Update the bikePointFeatures array in bulk
		bikePointFeatures = bikePointFeatures.map((feature) => {
			const update = batch.find((u) => u.id === feature.properties.id);

			if (update) {
				// Update the existing feature
				return {
					...feature,
					geometry: {
						...feature.geometry,
						coordinates: update.coords
					}
				};
			}

			return feature;
		});

		// @ts-expect-error - setData does exist but the types don't know about it
		map.getSource('bikes').setData({
			type: 'FeatureCollection',
			features: bikePointFeatures
		});
	};

	// Function to process the buffered updates
	const processBufferedUpdates = () => {
		if (updateBuffer.length > 0) {
			// Process the updates in batches
			const batches = [];

			while (updateBuffer.length > 0) {
				batches.push(updateBuffer.splice(0, BATCH_SIZE));
			}

			// Process each batch
			batches.forEach((batch) => {
				updateBikePositionsBatched(batch);
			});
		}
	};

	// Function to handle a new point received from the event source
	const handleNewPoint = (point: BikePoint) => {
		// Add the update to the buffer
		updateBuffer.push(point);

		// Check if the buffer size has reached the threshold
		if (updateBuffer.length >= BATCH_SIZE) {
			// Process the buffered updates
			processBufferedUpdates();
		}
	};

	const prettyHTMLPopup = (feature) => {
		const batteryPercentage = feature.properties.charge_perc;
		const batteryColor =
			batteryPercentage < 0.2
				? colors.danger
				: batteryPercentage < 0.4
					? colors.warning
					: colors.high;

		return `
			<div class="flex flex-col divide-y divide-gray-100 dark:divide-surface-600">
				<div class="px-2 pt-8 pb-4">
					<table class="w-full text-surface-500 dark:text-surface-300 border border-gray-100 dark:border-0">
						<tbody class="overflow-y-scroll text-xs">
							<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Id</span></td>
								</td>
								<td class="p-2">${feature.properties.id}</td>
							</tr>
							<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Batteri</span></td>
								</td>
								<td class="p-2">${Math.round(
									batteryPercentage * 100
								)}% <span class="text-xs" style="color: ${batteryColor}">■</span></td>
							</tr>
							<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Latitud</span></td>
								</td>
								<td class="p-2">${feature.geometry.coordinates[1]}</td>
							</tr>
							<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Longitud</span></td>
								</td>
								<td class="p-2">${feature.geometry.coordinates[0]}</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="flex flex-row justify-between px-2 pt-4 pb-2">	
					<a href="/admin/bikes/${
						feature.properties.id
					}" class="block font-xs text-surface-700 bg-gray-50 dark:bg-surface-600 hover:bg-gray-100 dark:hover:bg-surface-700 dark:text-surface-100 dark:hover:text-white px-2 py-1 rounded-md">Mer info</a>
					<button
						aria-describedby="stop-bike-form"
						form="stop-bike-form"
						type="submit"
						class="font-xs text-red-500 px-2 py-1"
						>Stoppa</button
					>
				</div>
			</div>
		`;
	};

	$: if (map) {
		map.on('load', () => {
			// remove existing symbol layers from the tile provider
			// const layers = map.getStyle().layers;

			// for (let i = 0; i < layers.length; i++) {
			// 	const layer = layers[i];
			// 	if (layer.type === 'symbol') {
			// 		map.removeLayer(layer.id);
			// 	}
			// }

			map.addSource('bikes', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: bikePointFeatures
				},
				cluster: true,
				clusterMaxZoom: 11, // Max zoom to cluster points on
				clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
				clusterProperties: {
					// keep separate counts for each battery level
					battery_danger: ['+', ['case', battery_danger, 1, 0]],
					battery_warning: ['+', ['case', battery_warning, 1, 0]],
					battery_high: ['+', ['case', battery_high, 1, 0]]
				}
			});

			map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'bikes',
				filter: ['==', 'cluster', true],
				paint: {
					// Use step expressions (https://maplibre.org/maplibre-style-spec/#expressions-step)
					// with three steps to implement three types of circles:
					//   * Blue, 20px circles when point count is less than 100
					//   * Yellow, 30px circles when point count is between 100 and 750
					//   * Pink, 40px circles when point count is greater than or equal to 750
					'circle-color': [
						'step',
						['get', 'point_count'],
						'#51bbd6',
						100,
						'#f1f075',
						750,
						'#f28cb1'
					],
					'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
				}
			});

			map.addLayer({
				id: 'cluster-count',
				type: 'symbol',
				source: 'bikes',
				filter: ['==', 'cluster', true],
				layout: {
					'icon-allow-overlap': true,
					'text-field': '{point_count_abbreviated}',
					'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
					'text-size': 12
				}
			});

			map.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'bikes',
				filter: ['!=', 'cluster', true],
				paint: {
					'circle-color': [
						'case',
						battery_danger,
						colors.danger,
						battery_warning,
						colors.warning,
						colors.high // default
					],
					'circle-radius': 8,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff'
				}
			});

			map.addLayer({
				id: 'unclustered-point-label',
				type: 'symbol',
				source: 'bikes',
				filter: ['!=', 'cluster', true],
				layout: {
					'icon-allow-overlap': true,
					'text-field': [
						'number-format',
						['get', 'charge_perc'],
						{ 'min-fraction-digits': 1, 'max-fraction-digits': 1 }
					],
					'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
					'text-size': 8
				},

				paint: {
					'text-color': ['case', ['<', ['get', 'charge_perc'], 0.2], 'white', 'black'] // white text on dark background
				}
			});

			// inspect a cluster on click
			map.on('click', 'clusters', (e) => {
				const features = map.queryRenderedFeatures(e.point, {
					layers: ['clusters']
				});
				const clusterId = features[0].properties.cluster_id;

				// @ts-expect-error - getSource is not in the typings
				map.getSource('bikes').getClusterExpansionZoom(clusterId, (err, zoom) => {
					if (err) return;

					map.easeTo({
						// @ts-expect-error - The features have a geometry, I've just not typed it out here
						center: features[0].geometry.coordinates,
						zoom
					});
				});
			});

			map.on('mouseenter', 'clusters', () => {
				map.getCanvas().style.cursor = 'pointer';
			});

			map.on('mouseleave', 'clusters', () => {
				map.getCanvas().style.cursor = '';
			});

			// When a click event occurs on a feature in
			// the unclustered-point layer, open a popup at
			// the location of the feature, with
			// description HTML from its properties.
			map.on('click', 'unclustered-point', (e) => {
				if (e.features === undefined) return;

				// @ts-expect-error - we expect the feature to be a valid BikePointFeature though it's typed as the generic MapGeoJSONFeature
				selectedBikeFeature = e.features[0];

				// @ts-expect-error - we expect the geometry to have coordinates
				const coordinates = e.features[0].geometry.coordinates.slice();

				// Ensure that if the map is zoomed out such that
				// multiple copies of the feature are visible, the
				// popup appears over the copy being pointed to.
				while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
					coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
				}

				const popupContent = prettyHTMLPopup(e.features[0]);

				new maplibregl.Popup().setLngLat(coordinates).setHTML(popupContent).addTo(map);
			});

			let i = 0;
			const timer = window.setInterval(() => {
				if (i > 100) {
					clearInterval(timer);
					return;
				}
				data.bikes.forEach((bike: Bike) => {
					// only update if the point is within the map bounds
					if (!map.getBounds().contains(bike.coords)) return;

					const newCoords = generatePointWithinRadius(bike.coords, distancePerUpdate);

					const newBike = {
						...bike,
						coords: newCoords
					};

					handleNewPoint(newBike);

					// animateToPoint(point.coords, newPoint, updateInterval, 0.5, (animatedPoint) => {
					// 	updateBikeSource({
					// 		id: point.id,
					// 		charge_perc: point.charge_perc,
					// 		coords: animatedPoint
					// 	});
					// });
					// point.coords = newPoint;
				});
				i++;
			}, updateInterval);
		});
	}
</script>

<Map />
<!-- Submitted via a button inside popup  -->
<form
	aria-hidden="true"
	class="absolute translate-x-full w-0"
	id="stop-bike-form"
	action="/admin/bikes?/stop"
	method="POST"
	use:enhance
>
	<input
		type="hidden"
		name="id"
		title="id på cykel som ska stoppas"
		value={selectedBikeFeature?.properties.id}
	/>
</form>
