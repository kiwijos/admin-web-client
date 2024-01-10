import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return {
		bike: await fetch(`${PUBLIC_REST_API_URL}/bikes/${params.id}`, {
			method: 'GET'
		}).then((r) => r.json())
	};
};
