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

	const updateBike = (data: { id: string; coords: [number, number] }) => {
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
			// Add bike source
			map.addSource('bikes', {
				type: 'geojson',
				data: bikePointFeatures
			});

			// Add bike layer
			map.addLayer({
				id: 'bikes',
				type: 'circle',
				source: 'bikes',
				paint: {
					'circle-radius': 6,
					'circle-color': '#000000'
				}
			});
		});

	onMount(() => {
		// set a delay to allow the map to load
		setTimeout(() => {
			evtSource = new EventSource('http://localhost:1337/v1/admin/feed', {
				withCredentials: true
			});

			evtSource.onmessage = function (event) {
				// reduce load by only updating id's in the 20s range

				const data = JSON.parse(event.data);

				// Uncomment and customize to reduce load
				// if (parseInt(data.id) > 50) {
				// 	return;
				// }

				updateBike({
					id: data.id,
					coords: data.coords
				});

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
