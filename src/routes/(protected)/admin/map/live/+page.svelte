<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl, { Map as MaplibreMap } from 'maplibre-gl';
	import Map from '$lib/components/Map.svelte';
	import { mapStore } from '$lib/stores/map';
	import { onMount } from 'svelte';
	import type { BikePointFeature } from '$lib/types/BikePointFeature';
	import type { PageData } from './$types';
	import type { Bike } from '$lib/types/Bike';
	import { applyAction, enhance } from '$app/forms';

	export let data: PageData;

	interface BikePoint {
		id: number;
		coords: [number, number];
		charge_perc: number;
	}

	let map: MaplibreMap;
	mapStore.subscribe((value) => (map = value));

	let evtSource: EventSource; // EventSource is a global type

	let loading = true;

	let selectedBike: BikePointFeature | undefined;

	// Cache popups
	let popups: { [key: number]: maplibregl.Popup } = {};

	let updateBuffer: BikePoint[] = [];

	// Set a threshold for the batch size
	let BATCH_SIZE = 500;

	const updateBikePositionsBatched = (batch: BikePoint[]) => {
		// Update the bikePointFeatures array in bulk
		data.bikes = data.bikes.map((feature: BikePointFeature) => {
			const update = batch.find((u) => u.id === feature.properties.id);

			if (update) {
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
			features: data.bikes
		});
	};

	// Function to process the buffered updates
	const processBufferedUpdates = () => {
		if (updateBuffer.length > 0) {
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
			processBufferedUpdates();
		}
	};

	$: if (map)
		map.on('load', () => {
			map.addSource('bikes', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: data.bikes
				},
				cluster: true,
				clusterMaxZoom: 15, // Don't cluster when zoomed in past 15
				clusterRadius: 30 // Cluster points within 30 pixels of each other
			});

			map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'bikes',
				filter: ['has', 'point_count'],
				paint: {
					// Use step expressions (https://maplibre.org/maplibre-style-spec/#expressions-step)
					// with three steps to implement three types of circles:
					//   * Blue/Cyan, 20px circles when point count is less than 100
					//   * Orange, 30px circles when point count is between 100 and 750
					//   * Pink, 40px circles when point count is greater than or equal to 750
					'circle-color': [
						'step',
						['get', 'point_count'],
						'#14b8a6',
						100,
						'#f97316',
						750,
						'#ec4899'
					],
					'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
				}
			});

			// Point count for clusters
			map.addLayer({
				id: 'cluster-count',
				type: 'symbol',
				source: 'bikes',
				filter: ['has', 'point_count'],
				layout: {
					'icon-allow-overlap': true,
					'text-field': '{point_count_abbreviated}',
					'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
					'text-size': 12
				}
			});

			// Individual points (not clusters)
			map.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'bikes',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': '#11b4da',
					'circle-radius': 8,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff'
				}
			});

			// Open a popup when clicking on a unclustered point
			map.on('click', 'unclustered-point', (e) => {
				if (!e.features || !e.features[0]) return;

				// @ts-expect-error - We know this can be used as a BikePointFeature
				const feature = (selectedBike = e.features[0] as BikePointFeature);
				const id = feature.properties.id;
				const coordinates = feature.geometry.coordinates.slice();

				// Make sure that if the map is zoomed out (very far!) such that
				// multiple copies of the feature are visible, the popup appears over the copy being clicked
				while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
					coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
				}

				let popup = popups[id];

				if (!popup) {
					const popupContent = singleBikeFormPopupHTML(feature);

					popup = popups[id] = new maplibregl.Popup()
						// @ts-expect-error - Coordinates are valid, just typed differently
						.setLngLat(coordinates)
						.setHTML(popupContent)
						.addTo(map);
					return;
				}

				// @ts-expect-error - Coordinates are valid, just typed differently
				if (!popup.isOpen()) popup.setLngLat(coordinates).addTo(map);
			});

			map.on('mouseenter', 'unclustered-point', () => {
				map.getCanvas().style.cursor = 'pointer';
			});

			map.on('mouseleave', 'unclustered-point', () => {
				map.getCanvas().style.cursor = '';
			});

			// Inspect cluster on click
			map.on('click', 'clusters', (e) => {
				const features = map.queryRenderedFeatures(e.point, {
					layers: ['clusters']
				});

				const clusterId = features[0].properties.cluster_id;

				// @ts-expect-error - getClusterExpansionZoom does not exist in the types it seems
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

			loading = false;
		});

	onMount(() => {
		evtSource = new EventSource('http://localhost:1337/v1/admin/feed', {
			withCredentials: true
		});

		evtSource.onerror = function (event) {
			console.error('EventSource failed:', event);
			evtSource.close();
			console.log('EventSource closed');
		};

		evtSource.onmessage = function (event) {
			const data = JSON.parse(event.data);

			handleNewPoint(data);
		};

		// close the EventSource connection when the component is destroyed
		return () => {
			evtSource.close();
			console.log('EventSource closed');
		};
	});

	const handleStartSimulation = () => {
		// @ts-expect-error - We wholeheartedly accept this untyped variable
		return async ({ result }) => {
			if (!result?.success) return;

			await applyAction(result); // Apply the action, which will update the form state
		};
	};
</script>

<form
	action="/admin/bikes?/simulate"
	method="POST"
	class="absolute top-2 right-4 z-10"
	use:enhance={handleStartSimulation}
>
	<button type="submit" class="btn variant-filled-primary">Simulate</button>
</form>

<Map />
