import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch }) => {
	return {
		trips: await fetch(`${PUBLIC_REST_API_URL}/admin/trips/all`).then((r) => r.json())
	};
};
