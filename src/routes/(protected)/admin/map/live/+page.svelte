<script lang="ts">
	import { onMount } from 'svelte';
	import { applyAction, enhance } from '$app/forms';

	import maplibregl, { Map as MaplibreMap } from 'maplibre-gl';

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
</script>

<Map />

<form
	action="/admin/bikes?/simulate"
	method="POST"
	class="absolute w-fit top-2 left-2 lg:left-56 z-[11] {!loading || 'animate-pulse'}"
	use:enhance={handleStartSimulation}
>
	<button
		type="submit"
		class="btn variant-filled-primary"
		disabled={simulationHasStarted ? true : loading ? true : false}>Starta simulering</button
	>
</form>

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
