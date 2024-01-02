import type { Bike } from '$lib/types/Bike';
import type { Trip } from '$lib/types/Trip';
import type { Transaction } from '$lib/types/Transaction';
import type { City } from '$lib/types/City';
import type { Zone } from '$lib/types/Zone';
import type { User } from '$lib/types/User';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			signed_in_as: null | {
				id: number;
			};
		}
		interface PageData {
			bike?: Bike;
			bikes?: Bike[];
			trips?: Trip[];
			transactions?: Transaction[];
			user?: User;
			users?: User[];
			cities?: City[];
			zones?: Zone[];
		}
		// interface Platform {}
	}
}

declare module '@fortawesome/free-solid-svg-icons/index.es' {
	export * from '@fortawesome/free-solid-svg-icons';
}

export {};
