import type { PageServerLoad } from './$types';
import { cities } from '$lib/data/cities';
import { zones } from '$lib/data/zones';

export const load: PageServerLoad = async () => {
	return {
		props: {
			cities,
			zones
		}
	};
};
