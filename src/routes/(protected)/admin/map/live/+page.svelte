<script lang="ts">
	import { onMount } from 'svelte';
	import { applyAction, enhance } from '$app/forms';

	import maplibregl, { type Map as MaplibreMap, type ExpressionSpecification } from 'maplibre-gl';

	import Map from '$lib/components/Map.svelte';
	import { mapStore } from '$lib/stores/map';
	import { singleBikeFormPopupHTML } from '$lib/services/markerMaker';

	import type { BikePointFeature } from '$lib/types/BikePointFeature';
	import type { PageData } from './$types';
	import type { CityPolygonFeature } from '$lib/types/CityPolygonFeature';
	import type { ZonePolygonFeature } from '$lib/types/ZonePolygonFeature';
	import type { BikeFromFeed } from '$lib/types/BikeFromFeed';

	export let data: PageData;

	let map: MaplibreMap;
	mapStore.subscribe((value) => (map = value));

	// Define colors for battery levels
	const colors = {
		low: 'rgb(239, 68, 68)',
		medium: 'rgb(250, 204, 21)',
		high: 'rgb(34, 197, 94)'
	};

	// Define expressions for battery levels used in layers
	const batteryLow: ExpressionSpecification = ['<=', ['get', 'charge_perc'], 0.15];
	const batteryMedium: ExpressionSpecification = [
		'all',
		['>', ['get', 'charge_perc'], 0.2],
		['<=', ['get', 'charge_perc'], 0.4]
	];

	// eslint-disable-next-line no-unused-vars -- keep for reference
	const batteryHigh: ExpressionSpecification = ['>', ['get', 'charge_perc'], 0.4];

	// handle checkbox toggle layer based on checked state and value
	const toggleLayer = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const layerId = target.value;

		console.log('toggleLayer', layerId, target.checked);

		map.getStyle().layers?.forEach((layer) => {
			if (layer.id.startsWith(layerId)) {
				map.setLayoutProperty(layer.id, 'visibility', target.checked ? 'visible' : 'none');
			}
		});
	};

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

	let evtSource: EventSource; // EventSource is a global type

	let loading = true;

	let selectedBike: BikePointFeature | undefined;

	// Cache popups
	let popups: { [key: number]: maplibregl.Popup } = {};

	let updateBuffer: BikeFromFeed[] = [];

	// Set a threshold for the batch size
	let BATCH_SIZE = 500;

	const updateBikePositionsBatched = (batch: BikeFromFeed[]) => {
		// Update the bikePointFeatures array in bulk
		data.bikes = data.bikes.map((feature: BikePointFeature) => {
			const update = batch.find((u) => u.id === feature.properties.id);

			if (update) {
				return {
					...feature,
					geometry: {
						...feature.geometry,
						coordinates: update.coords
					},
					properties: {
						...feature.properties,
						charge_perc: update.charge_perc,
						status_id: update.status_id,
						speed: update.speed
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
	const handleNewPoint = (point: BikeFromFeed) => {
		// Add the update to the buffer
		updateBuffer.push(point);

		// Check if the buffer size has reached the threshold
		if (updateBuffer.length >= BATCH_SIZE) {
			processBufferedUpdates();
		}
	};

	$: if (map)
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
				const fillLayerID = `${zoneDescr}-fill`;

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
							filter: ['==', 'descr', zoneDescr]
						},
						labelLayerId // <-- insert under text labels
					);
				}

				const borderLayerId = `${zoneDescr}-border`;

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
							filter: ['==', 'descr', zoneDescr]
						},
						labelLayerId // <-- insert under text labels
					);
				}
			});

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
					'text-font': ['Arial Unicode MS Bold'],
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
			map.addLayer({
				id: 'battery-fill',
				type: 'circle',
				source: 'bikes',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': [
						'case',
						batteryLow,
						colors.low,
						batteryMedium,
						colors.medium,
						colors.high // default
					],
					'circle-radius': 9,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff'
				}
			});

			map.addLayer({
				id: 'battery-label',
				type: 'symbol',
				source: 'bikes',
				filter: ['!', ['has', 'point_count']],
				layout: {
					'icon-allow-overlap': true,
					'text-field': [
						'concat',
						[
							'number-format',
							['*', ['get', 'charge_perc'], 100],
							{ 'min-fraction-digits': 0, 'max-fraction-digits': 0 }
						],
						'%'
					],
					'text-font': ['Arial Unicode MS Bold'],
					'text-size': 9,
					'text-offset': [1.2, -1.6]
				},

				paint: {
					'text-halo-color': '#fff',
					'text-halo-width': 2,
					'text-color': 'black'
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
				const popupContent = singleBikeFormPopupHTML(feature);

				if (!popup) {
					popup = popups[id] = new maplibregl.Popup()
						// @ts-expect-error - Coordinates are valid, just typed differently
						.setLngLat(coordinates)
						.setHTML(popupContent)
						.addTo(map);
					return;
				}

				// @ts-expect-error - Coordinates are valid, just typed differently
				popup.setLngLat(coordinates).setHTML(popupContent).addTo(map);
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

	let simulationHasStarted = false;

	// @ts-expect-error - untyped variables are fine
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleStartSimulation = ({ formElement, formData, action, cancel, submitter }) => {
		if (simulationHasStarted === true) {
			cancel();
			return;
		}

		simulationHasStarted = true;

		// @ts-expect-error - We wholeheartedly accept this untyped variable too
		return async ({ result }) => {
			if (!result?.data?.success) {
				simulationHasStarted = false; // Something went wrong, so we can try again
				return;
			}

			await applyAction(result); // Apply the action, which will update the form state
		};
	};

	// @ts-expect-error - untyped variables are fine
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleBikeActiveStatus = ({ formElement, formData, action, cancel, submitter }) => {
		if (!formData.get('id')) {
			cancel();
			return;
		}

		console.log(action);

		if (action.search === '?/deactivate' && selectedBike?.properties.active === false) {
			cancel();
			return;
		}

		if (action.search === '?/activate' && selectedBike?.properties.active === true) {
			cancel();
			return;
		}

		// @ts-expect-error - We wholeheartedly accept this untyped variable too
		return async ({ result }) => {
			if (!result?.data?.success) return;

			const updated = result.data.bike;

			const updatedFeature: BikePointFeature = {
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: updated.coords
				},
				properties: {
					...selectedBike?.properties,
					id: updated.id,
					active: updated.active,
					charge_perc: updated.charge_perc,
					city_id: updated.city_id,
					status_id: updated.status_id,
					status_descr: updated.status_descr
				}
			};

			// splice the updated feature into the data
			const index = data.bikes.findIndex((bike) => bike.properties.id === updated.id);
			data.bikes.splice(index, 1, updatedFeature);

			selectedBike = selectedBike?.properties.id === updated.id ? updatedFeature : selectedBike;

			// @ts-expect-error - setData does exist but the types don't know about it
			map.getSource('bikes').setData({
				type: 'FeatureCollection',
				features: data.bikes
			});

			const popup = popups[parseInt(formData.get('id') as string)];

			if (popup) popup.setHTML(singleBikeFormPopupHTML(updatedFeature));

			await applyAction(result); // Apply the action, which will update the form state
		};
	};

	let showToolBox = true;

	const handleToolBoxOpen = () => {
		if (showToolBox === true) return;
		showToolBox = true;
	};

	const handleToolBoxClose = () => {
		if (showToolBox === false) return;
		showToolBox = false;
	};
</script>

<Map />

<button
	on:click={handleToolBoxOpen}
	class="btn-icon text-lg text-surface-800 absolute top-0 left-0 lg:left-52 z-[11] transition-opacity duration-300 {!showToolBox
		? 'opacity-100'
		: 'opacity-0 pointer-events-none'}">&searr;</button
>
<div
	aria-hidden={showToolBox ? 'false' : 'true'}
	class="absolute drop-shadow bg-white dark:bg-surface-800 divide-y dark:divide-surface-600 rounded-md w-fit top-2 left-2 lg:left-[13.5rem] z-[11] transition-all transform duration-200 ease-in-out {showToolBox
		? 'opacity-100 translate-y-0 translate-x-0'
		: 'opacity-0 pointer-events-none transform -translate-y-full -translate-x-full'}"
>
	<div class="flex justify-between">
		<button
			on:click={handleToolBoxClose}
			class="inline w-6 h-6 rounded-full text-xs text-surface-500 dark:text-surface-300 hover:bg-gray-50 hover:dark:bg-surface-600"
			>&nwarr;</button
		>
		<form
			action="/admin/bikes?/simulate"
			method="POST"
			class="p-2 {loading ? 'animate-pulse' : ''}"
			use:enhance={handleStartSimulation}
		>
			<button
				type="submit"
				class="btn btn-sm text-xs ring-1 ring-surface-50 dark:ring-surface-500 hover:ring-surface-200 dark:hover:ring-surface-500 {simulationHasStarted
					? 'shadow-inner bg-gray-100 dark:bg-surface-700'
					: 'bg-white dark:bg-surface-800'}"
				disabled={simulationHasStarted ? true : loading ? true : false}>Starta simulering</button
			>
		</form>
	</div>
	<label class="label p-2"
		><p class="text-xs text-surface-500 dark:text-surface-300">Visa batterinivå</p>
		<div class="flex items-center space-x-2">
			<input
				type="checkbox"
				on:change={toggleLayer}
				value="battery"
				title="Visa batterinivå"
				checked
				class="w-4 h-4 rounded-sm bg-surface-100 dark:bg-surface-500 dark:text-surface-900 border focus:ring-1 focus:dark:ring-surface-500"
			/>
			<div class="grid grid-cols-3 gap-1 text-surface-700">
				<span class="block p-0.5 text-center bg-red-500 text-xs">0-15%</span>
				<span class="block p-0.5 text-center bg-yellow-400 text-xs">16-40%</span>
				<span class="block p-0.5 text-center bg-green-500 text-xs">41-100%</span>
			</div>
		</div>
	</label>
	<label class="label p-2"
		><p class="text-xs text-surface-500 dark:text-surface-300">Visa zoner</p>
		<div class="flex items-center space-x-2">
			<input
				type="checkbox"
				value="forbidden"
				on:change={toggleLayer}
				title="Visa förbjuda zoner"
				checked
				class="w-4 h-4 rounded-sm bg-surface-100 dark:bg-surface-500 dark:text-surface-900 border focus:ring-1 focus:dark:ring-surface-500"
			/>
			<span class="block text-sm">Förbjudna</span>
		</div>
		<div class="flex items-center space-x-2">
			<input
				type="checkbox"
				on:change={toggleLayer}
				value="parking"
				title="Visa parkeringszoner"
				checked
				class="w-4 h-4 rounded-sm bg-surface-100 dark:bg-surface-500 dark:text-surface-900 border focus:ring-1 focus:dark:ring-surface-500"
			/>
			<span class="block text-sm">Parkering</span>
		</div>
		<div class="flex items-center space-x-2">
			<input
				type="checkbox"
				on:change={toggleLayer}
				value="charging"
				title="Visa laddstationer"
				checked
				class="w-4 h-4 rounded-sm bg-surface-100 dark:bg-surface-500 dark:text-surface-900 border focus:ring-1 focus:dark:ring-surface-500"
			/>
			<span class="block text-sm">Laddning</span>
		</div>
	</label>
</div>

<!-- STOP: Submitted via a button inside popup  -->
<form
	aria-hidden="true"
	class="absolute translate-x-full w-0"
	id="stop-bike-form"
	action="/admin/bikes?/deactivate"
	method="POST"
	use:enhance={handleBikeActiveStatus}
>
	<input
		type="hidden"
		name="id"
		title="id på cykel som ska stoppas"
		value={selectedBike?.properties?.id}
	/>
</form>
<!-- STOP: Submitted via a button inside popup -->

<!-- START: Submitted via a button inside popup  -->
<form
	aria-hidden="true"
	class="absolute translate-x-full w-0"
	id="start-bike-form"
	action="/admin/bikes?/activate"
	method="POST"
	use:enhance={handleBikeActiveStatus}
>
	<input
		type="hidden"
		name="id"
		title="id på cykel som ska stoppas"
		value={selectedBike?.properties?.id}
	/>
</form>
<!-- START: Submitted via a button inside popup -->
