<script lang="ts">
	import { Map, AttributionControl } from 'maplibre-gl';
	import { PUBLIC_MAPTILER_API_KEY } from '$env/static/public';
	import { mapStore } from '$lib/stores/map';

	let mapContainer: HTMLDivElement;

	$: if (mapContainer) {
		const initialState = { lat: 62.0, lng: 15.0, zoom: 4 };

		const map: Map = new Map({
			container: mapContainer,
			style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${PUBLIC_MAPTILER_API_KEY}`,
			center: [initialState.lng, initialState.lat],
			zoom: initialState.zoom,
			attributionControl: false
		});
		map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

		mapStore.set(map);
	}
</script>

<div class="map-wrap">
	<a href="https://www.maptiler.com" class="watermark"
		><img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler logo" /></a
	>
	<div class="map" bind:this={mapContainer} />
</div>

<style>
	@import 'maplibre-gl/dist/maplibre-gl.css';

	.map-wrap {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.map {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.watermark {
		position: absolute;
		left: 10px;
		bottom: 10px;
		z-index: 1;
	}
</style>
