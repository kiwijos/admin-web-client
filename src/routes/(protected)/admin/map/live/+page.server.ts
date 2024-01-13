import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch }) => {
	return {
		bikes: await fetch(`${PUBLIC_REST_API_URL}/bikes`).then((r) => r.json()),
		cities: await fetch(`${PUBLIC_REST_API_URL}/cities`).then((r) => r.json()),
		zones: await fetch(`${PUBLIC_REST_API_URL}/zones`).then((r) => r.json())
	};
};
