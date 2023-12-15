<script lang="ts">
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import Map from '$lib/components/Map.svelte';
	import { mapStore } from '$lib/stores/map';
	import type { BikePointFeature } from '$lib/types/BikePointFeature';
	import {
		generatePointWithinRadius,
		generateRandomPointInSweden
	} from '$lib/services/pointGenerator';
	import { animateToPoint } from '$lib/services/animator';

	let map: MaplibreMap;
	mapStore.subscribe((value) => (map = value));

	let bikePointFeatures: BikePointFeature[] = [];

	interface Point {
		id: string;
		coords: [number, number];
	}

	const speedKmPerHour = 2000;
	const speedMetersPerSecond = speedKmPerHour / 3.6;
	const updateInterval = 1000;
	const distancePerUpdate = speedMetersPerSecond * (updateInterval / 1000);

	let points: Point[] = [];
	const numPoints = 10;

	// Initialize random points
	for (let i = 0; i < numPoints; i++) {
		points.push({
			id: `${i + 1}`,
			coords: generateRandomPointInSweden()
		});
	}

	const updateBikeSource = (data: Point) => {
		const id = data.id;

		const updatedFeature: BikePointFeature = {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: data.coords
			},
			properties: {
				id: id
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
		// @ts-expect-error - setData does exist
		map.getSource('bikes').setData({
			type: 'FeatureCollection',
			features: bikePointFeatures
		});
	};

	$: if (map)
		map.on('load', () => {
			map.addSource('bikes', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: bikePointFeatures
				}
			});

			map.addLayer({
				id: 'bike-points',
				type: 'circle',
				source: 'bikes',
				paint: {
					'circle-radius': 6,
					'circle-color': 'red' //'rgb(59 130 246)'
				}
			});

			console.log(points);

			let i = 0;
			const timer = window.setInterval(() => {
				if (i > 60) {
					clearInterval(timer);
					return;
				}
				points.forEach((point) => {
					const newPoint = generatePointWithinRadius(point.coords, distancePerUpdate);

					animateToPoint(point.coords, newPoint, updateInterval, (animatedPoint) => {
						updateBikeSource({
							id: point.id,
							coords: animatedPoint
						});
					});

					point.coords = newPoint;
				});
				i++;
			}, updateInterval);
		});
</script>

<Map />
