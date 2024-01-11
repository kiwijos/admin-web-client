import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch }) => {
	return {
		bikes: await fetch(`${PUBLIC_REST_API_URL}/bikes`).then((r) => r.json())
	};
};
