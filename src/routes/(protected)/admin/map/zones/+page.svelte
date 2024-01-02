<script lang="ts">
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import type { PageData } from './$types';
	import type { City } from '$lib/types/City';
	import type { Zone } from '$lib/types/Zone';

	import Map from '$lib/components/Map.svelte';
	import maplibregl from 'maplibre-gl';
	import { mapStore } from '$lib/stores/map';
	import { PUBLIC_MAPTILER_API_KEY } from '$env/static/public';
	import Fa from 'svelte-fa';
	import { faChevronRight, faXmark } from '@fortawesome/free-solid-svg-icons';

	import { TreeView, TreeViewItem, type TreeViewNode } from '@skeletonlabs/skeleton';

	export let data: PageData;

	// Get the map from the store
	let map: MaplibreMap;
	mapStore.subscribe((value) => {
		map = value;
	});

	let loading = true; // used to show a loading indicator while we add the sources and layers to the map

	// Typing this as a TreeViewNode[] is not strictly neccessary as that typing is used for the TreeView component's recursive mode specifically,
	// but the format is convenient for the TreeView component generally.
	let treeViewNodes: TreeViewNode[] = [];

	// The tree structure is generated from the data in the cities array to create a hierarchical checkbox list.
	// Each city has three zones: parking, charging and forbidden because we want to be able to toggle the visibility of each zone on a city level.
	// Each zone has one or more layers in the map matching the zone's id (e.g. `STHLM-parking-fill` and `STHLM-parking-symbol`).
	$: treeViewNodes = data.cities.map((city: City) => {
		return {
			id: city.id,
			content: city.name,
			children: [
				{ id: `${city.id}-parking`, content: 'Parkering' },
				{ id: `${city.id}-charging`, content: 'Laddning' },
				{ id: `${city.id}-forbidden`, content: 'Förbjuden' }
			]
		};
	});

	// Here we refer to the treeViewNodes, but really thinking of the `nodes` as checkboxes might be more intuitive.
	function onNodeChange(e: Event) {
		const { id, checked } = e.target as HTMLInputElement;

		// If the node is a city, we want to also toggle the visibility of all the city's zones.
		for (const layer of map.getStyle().layers) {
			if (layer.id.startsWith(id)) {
				map.setLayoutProperty(layer.id, 'visibility', checked ? 'visible' : 'none');
			}
		}
	}

	const cityMaxZoom = 11;

	const zoneOptions: {
		[key: string]: { color: string; label: string; text_color: string; minZoom: number };
	} = {
		parking: { color: '#0ea5e9', label: 'Parkering', text_color: '#0c4a6e', minZoom: 11 },
		charging: { color: '#10b981', label: 'Laddning', text_color: '#064e3b', minZoom: 11 },
		forbidden: { color: '#ef4444', label: 'Förbjuden', text_color: '#7f1d1d', minZoom: 11 }
	};

	$: if (map) {
		map.on('load', () => {
			// Extract coordinates for each city
			const coordinates: [number, number][][][] = data.cities.map((city: City) => {
				return city.geometry.coordinates;
			});

			// Fit the map to the bounds of all cities so they are all visible on the map when it loads
			const bounds = coordinates.reduce(
				(acc, polygon) => {
					const polygonBounds = polygon.reduce(
						(innerAcc, coord) => {
							coord.forEach((point) => {
								innerAcc.extend(point);
							});
							return innerAcc;
						},
						new maplibregl.LngLatBounds(polygon[0][0], polygon[0][0])
					);

					acc.extend(polygonBounds);
					return acc;
				},
				new maplibregl.LngLatBounds(coordinates[0][0][0], coordinates[0][0][0])
			);

			map.fitBounds(bounds, {
				padding: 40
			});

			///////// ADD CITY SOURCES AND LAYERS //////////
			const cityFeatures = data.cities.map((city: City) => {
				return {
					type: 'Feature',
					geometry: {
						type: city.geometry.type,
						coordinates: city.geometry.coordinates
					},
					properties: { name: city.name, id: city.id }
				};
			});

			map.addSource('cities', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: cityFeatures
				}
			});

			cityFeatures.forEach((feature) => {
				const cityId: string = feature.properties['id'];
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
						// fly to the city if map is zoomed out
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

					// Change it back to a pointer when it leaves.
					map.on('mouseleave', fillLayerId, () => {
						map.getCanvas().style.cursor = '';
					});
				}

				const borderLayerId = `${cityId}-border`;

				// Add a layer for this city if it hasn't been added already.
				if (!map.getLayer(borderLayerId)) {
					map.addLayer({
						id: borderLayerId,
						type: 'line',
						source: 'cities',
						layout: {},
						paint: {
							'line-color': '#4f46e5',
							'line-width': 3
						},
						filter: ['==', 'id', cityId]
					});
				}
			});

			///////// ADD ZONE SOURCES AND LAYERS //////////
			const zoneFeatures = data.zones.map((zone: Zone) => {
				return {
					type: 'Feature',
					geometry: {
						type: zone.geometry.type,
						coordinates: zone.geometry.coordinates
					},
					properties: { zone_type: zone.descr, city_id: zone.city_id }
				};
			});

			const zoneFeatureCollection = {
				type: 'FeatureCollection',
				features: zoneFeatures
			};

			map.addSource('zones', {
				type: 'geojson',
				data: zoneFeatureCollection
			});

			// Insert the zone layers beneath any symbol layer with a "text-field" property.
			const layers = map.getStyle().layers;

			let labelLayerId: string;
			for (let i = 0; i < layers.length; i++) {
				// @ts-expect-error - we are aware that it might be undefined
				if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
					labelLayerId = layers[i].id;
					break;
				}
			}

			zoneFeatureCollection.features.forEach((feature) => {
				const zoneType: string = feature.properties['zone_type'];
				const cityId: string = feature.properties['city_id'];
				const fillLayerID = `${cityId}-${zoneType}-fill`;

				// Add a layer for this type (parking/charging/forbidden) if it hasn't been added already.
				if (!map.getLayer(fillLayerID)) {
					map.addLayer(
						{
							id: fillLayerID,
							type: 'fill',
							minzoom: zoneOptions[zoneType].minZoom,
							source: 'zones',
							layout: {},
							paint: {
								// 'fill-pattern': zoneOptions[zoneType].pattern,
								'fill-color': zoneOptions[zoneType].color,
								'fill-opacity': 0.5,
								'fill-outline-color': '#ffffff'
							},
							filter: ['all', ['==', 'zone_type', zoneType], ['==', 'city_id', cityId]]
						},
						labelLayerId // insert before the label layer id
					);
				}

				// Add a layer for the zone type's symbol if it hasn't been added already.
				const symbolLayerID = `${cityId}-${zoneType}-symbol`;
				if (!map.getLayer(symbolLayerID)) {
					map.addLayer({
						id: symbolLayerID,
						type: 'symbol',
						minzoom: zoneOptions[zoneType].minZoom,
						source: 'zones',
						layout: {
							'icon-allow-overlap': true,
							'text-field': zoneOptions[zoneType].label,
							'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
							'text-size': 9,
							'text-transform': 'uppercase'
						},
						paint: {
							'text-color': zoneOptions[zoneType].text_color
						},
						filter: ['all', ['==', 'zone_type', zoneType], ['==', 'city_id', cityId]]
					});
				}
			});

			///////// ADD 3D BUILDING SOURCES AND LAYERS //////////

			map.addSource('openmaptiles', {
				url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${PUBLIC_MAPTILER_API_KEY}`,
				type: 'vector'
			});

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
				// @ts-expect-error - the labelLayerId is in fact defined
				labelLayerId
			);

			loading = false;
		});
	}

	let filtersOpen = false;
</script>

{#if loading}
	<div class="fixed top-2 left-4 lg:left-56 z-[11] placeholder-circle animate-pulse w-10"></div>
{:else}
	<button
		title="Öppna filter"
		class="btn btn-sm btn-icon fixed top-2 left-4 lg:left-56 z-[11] focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-900 drop-shadow"
		on:click={() => (filtersOpen = true)}
	>
		<Fa icon={faChevronRight} class="text-gray-500 dark:text-surface-400" />
	</button>

	<div
		class="absolute top-0 left-0 lg:left-52 w-52 h-full z-[12] bg-gray-50 dark:bg-surface-900 px-4 py-2 rounded-r-xl {filtersOpen
			? 'visible'
			: 'hidden'}"
	>
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold">Filter</h2>
			<button
				class="btn btn-sm btn-icon focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-800 hover:bg-gray-100 dark:hover:bg-surface-700"
				on:click={() => (filtersOpen = false)}
			>
				<Fa icon={faXmark} class="text-gray-500 dark:text-surface-400" />
			</button>
		</div>

		<TreeView>
			{#each treeViewNodes as node}
				<TreeViewItem>
					<svelte:fragment slot="lead">
						<input type="checkbox" id={node.id} checked class="checkbox" on:change={onNodeChange} />
					</svelte:fragment>
					<p>{node.content}</p>
					<svelte:fragment slot="children">
						{#if node.children}
							{#each node.children as child}
								<TreeViewItem>
									<svelte:fragment slot="lead">
										<input
											type="checkbox"
											id={child.id}
											checked
											class="checkbox"
											on:change={onNodeChange}
										/>
									</svelte:fragment>
									<p>{child.content}</p>
								</TreeViewItem>
							{/each}
						{/if}
					</svelte:fragment>
				</TreeViewItem>
			{/each}
		</TreeView>
	</div>
{/if}

<Map />
