import type { Map } from 'maplibre-gl';
import { writable } from 'svelte/store';

function createMapStore() {
	const { subscribe, set } = writable<Map>(undefined);

	return {
		subscribe: subscribe,
		set: async (map: Map) => {
			set(map);
		}
	};
}

export const mapStore = createMapStore();
