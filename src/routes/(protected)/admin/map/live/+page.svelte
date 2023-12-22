<script lang="ts">
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import Map from '$lib/components/Map.svelte';
	import { mapStore } from '$lib/stores/map';
	import { onMount, onDestroy } from 'svelte';
	// import { animateToPoint } from '$lib/services/animator';
	import type { BikePointFeature } from '$lib/types/BikePointFeature';

	let map: MaplibreMap;
	mapStore.subscribe((value) => (map = value));

	let evtSource: EventSource;

	// let bikeLines: {
	// 	id: string;
	// 	coords: [number, number][];
	// }[] = [];

	let bikePointFeatures: BikePointFeature[] = [];

	const updateBike = (id: string, coords: [number, number]) => {
		const updatedFeature: BikePointFeature = {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: coords
			},
			properties: {
				id: id
			}
		};

		const existingIndex = bikePointFeatures.findIndex((feature) => feature.properties.id === id);

		if (existingIndex === -1) {
			// Add new feature
			bikePointFeatures.push(updatedFeature);
		} else {
			// Update existing feature
			bikePointFeatures[existingIndex] = updatedFeature;
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
			// remove existing symbol layers from the tile provider (they really bog down the map)
			const layers = map.getStyle().layers;
			console.log(layers);
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
				clusterMaxZoom: 11, // Don't cluster when zoomed in past 11
				clusterRadius: 50 // Cluster points within 50 pixels of each other
			});

			map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'bikes',
				filter: ['has', 'point_count'],
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
				filter: ['has', 'point_count'],
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

				// @ts-expect-error - getClusterExpansionZoom does exist in the types
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
		// set a delay to allow the map to load
		setTimeout(() => {
			evtSource = new EventSource('http://localhost:1337/v1/admin/feed', {
				withCredentials: true
			});

			evtSource.onmessage = function (event) {
				const data = JSON.parse(event.data);

				if (!map || !map.getBounds().contains(data.coords)) return;

				updateBike(data.id, data.coords);

				// check if the bike is already in the array
				// const existingIndex = bikeLines.findIndex((bike) => bike.id === data.id);

				// if (existingIndex === -1) {
				// 	// Add new bike
				// 	bikeLines.push({
				// 		id: data.id,
				// 		coords: [data.coords]
				// 	});

				// 	updateBike({
				// 		id: data.id,
				// 		coords: data.coords
				// 	});
				// } else {
				// 	const prevPoint =
				// 		bikeLines[existingIndex].coords[bikeLines[existingIndex].coords.length - 1];
				// 	// Update existing bike
				// 	bikeLines[existingIndex].coords.push(data.coords);

				// 	animateToPoint(prevPoint, data.coords, 10000, (coords) => {
				// 		updateBike({
				// 			id: data.id,
				// 			coords: coords
				// 		});
				// 	});
				// }
			};

			evtSource.onerror = function (event) {
				console.error('EventSource failed:', event);
				evtSource.close();
				console.log('EventSource closed');
			};
		}, 3000);
	});

	//close the EventSource connection when the component is destroyed
	$: if (evtSource)
		onDestroy(() => {
			evtSource.close();
			console.log('EventSource closed');
		});

	const startSimulation = () => {
		const result = fetch('http://localhost:1337/v1/admin/simulate');
		console.log(result);
	};
</script>

<button class="absolute top-0 right-0 z-10 btn variant-filled-primary" on:click={startSimulation}
	>Simulera</button
>
<Map />
