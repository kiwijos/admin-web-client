<script lang="ts">
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import Map from '$lib/components/Map.svelte';
	import { mapStore } from '$lib/stores/map';
	import { onMount, onDestroy } from 'svelte';
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

	let bikePointFeatures: BikePointFeature[] = data.bikes.map((bike: Bike) => {
		return {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: bike.coords
			},
			properties: {
				id: bike.id,
				city_id: bike.city_id,
				charge_perc: bike.charge_perc
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

	$: if (map)
		map.on('load', () => {
			// remove existing symbol layers from the tile provider (they can really bog down the map)
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
					'circle-radius': 4,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff'
				}
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
	});

	// close the EventSource connection when the component is destroyed
	$: if (evtSource)
		onDestroy(() => {
			evtSource.close();
			console.log('EventSource closed');
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
