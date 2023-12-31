import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async () => {
	return {
		zones: await fetch(`${PUBLIC_REST_API_URL}/zones`, {
			method: 'GET'
		}).then((r) => r.json()),
		cities: await fetch(`${PUBLIC_REST_API_URL}/cities`, {
			method: 'GET'
		}).then((r) => r.json())
	};
};
