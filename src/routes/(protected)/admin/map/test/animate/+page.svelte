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
	// import { animateToPoint } from '$lib/services/animator';

	let map: MaplibreMap;
	mapStore.subscribe((value) => (map = value));

	let selectedBikeFeature: BikePointFeature | null = null; // Bike in popup, if any

	// Define colors for battery levels
	const colors = {
		danger: '#ff0000',
		warning: '#ff9900',
		low: '#ffff00',
		high: '#00ff00'
	};

	// Define expressions for battery levels used in layers
	const battery_danger: ExpressionSpecification = ['<', ['get', 'battery_percentage'], 0.1];
	const batteery_warning: ExpressionSpecification = [
		'all',
		['>=', ['get', 'battery_percentage'], 0.1],
		['<', ['get', 'battery_percentage'], 0.2]
	];
	const battery_low: ExpressionSpecification = [
		'all',
		['>=', ['get', 'battery_percentage'], 0.2],
		['<', ['get', 'battery_percentage'], 0.4]
	];
	const battery_high: ExpressionSpecification = ['>=', ['get', 'battery_percentage'], 0.4];

	// Collect all bikes
	let bikePointFeatures: BikePointFeature[] = [];

	interface Point {
		id: string;
		coords: [number, number];
		battery_percentage: number;
	}

	// Define props for fake bikes
	const speedKmPerHour = 2000;
	const speedMetersPerSecond = speedKmPerHour / 3.6;
	const updateInterval = 10000;
	const distancePerUpdate = speedMetersPerSecond * (updateInterval / 1000);

	let points: Point[] = [];
	const numPoints = 100;

	// Create fake bikes
	for (let i = 0; i < numPoints; i++) {
		points.push({
			id: `${i + 1}`,
			coords: generateRandomPointInSweden(),
			battery_percentage: Math.random()
		});
	}

	// Add fake bikes to map
	const updateBikeSource = (data: Point) => {
		const id = data.id;

		const updatedFeature: BikePointFeature = {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: data.coords
			},
			properties: {
				id: id,
				battery_percentage: data.battery_percentage
			}
		};

		const existingIndex = bikePointFeatures.findIndex((feature) => feature.properties.id === id);

		if (existingIndex !== -1) {
			// Update existing feature
			bikePointFeatures[existingIndex] = updatedFeature;
		} else {
			// Add new feature
			bikePointFeatures.push(updatedFeature);
		}

		// Update map source
		// @ts-expect-error - setData does exist but TS doesn't know that
		map.getSource('bikes').setData({
			type: 'FeatureCollection',
			features: bikePointFeatures
		});
	};

	const prettyHTMLPopup = (feature: BikePointFeature) => {
		const batteryPercentage = feature.properties.battery_percentage;
		const batteryColor =
			batteryPercentage < 0.1
				? colors.danger
				: batteryPercentage < 0.2
					? colors.warning
					: batteryPercentage < 0.4
						? colors.low
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
					<a href="/bikes/${
						feature.properties.id
					}/info" class="block font-xs text-surface-700 bg-gray-50 dark:bg-surface-600 hover:bg-gray-100 dark:hover:bg-surface-700 dark:text-surface-100 dark:hover:text-white px-2 py-1">Mer info</a>
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

	$: if (map)
		map.on('load', () => {
			// remove existing symbol layers from the tile provider
			const layers = map.getStyle().layers;

			for (let i = 0; i < layers.length; i++) {
				const layer = layers[i];
				if (layer.type === 'symbol') {
					map.removeLayer(layer.id);
				}
			}

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
					battery_warning: ['+', ['case', batteery_warning, 1, 0]],
					battery_low: ['+', ['case', battery_low, 1, 0]],
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
						batteery_warning,
						colors.warning,
						battery_low,
						colors.low,
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
						['get', 'battery_percentage'],
						{ 'min-fraction-digits': 1, 'max-fraction-digits': 1 }
					],
					'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
					'text-size': 8
				},

				paint: {
					'text-color': ['case', ['<', ['get', 'battery_percentage'], 0.2], 'white', 'black']
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

				// @ts-expect-error - we expect the feature to be a valid BikePointFeature though it's typed as the generic MapGeoJSONFeature
				const popupContent = prettyHTMLPopup(e.features[0]);

				new maplibregl.Popup().setLngLat(coordinates).setHTML(popupContent).addTo(map);
			});

			points.forEach((point) => {
				updateBikeSource({
					id: point.id,
					battery_percentage: point.battery_percentage,
					coords: point.coords
				});
			});

			let i = 0;
			const timer = window.setInterval(() => {
				if (i > 10) {
					clearInterval(timer);
					return;
				}
				points.forEach((point) => {
					// only update if the point is within the map bounds
					if (!map.getBounds().contains(point.coords)) return;

					const newPoint = generatePointWithinRadius(point.coords, distancePerUpdate);

					updateBikeSource({
						id: point.id,
						battery_percentage: point.battery_percentage,
						coords: newPoint
					});

					// animateToPoint(point.coords, newPoint, updateInterval, 10, (animatedPoint) => {
					// 	updateBikeSource({
					// 		id: point.id,
					// 		battery_percentage: point.battery_percentage,
					// 		coords: animatedPoint
					// 	});
					// });
					// point.coords = newPoint;
				});
				i++;
			}, updateInterval);
		});
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
