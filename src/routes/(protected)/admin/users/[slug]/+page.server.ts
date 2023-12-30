import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, fetch, params }) => {
	return {
		users: await fetch(`${PUBLIC_REST_API_URL}/admin/users/${params.slug}`, {
			method: 'GET',
			headers: {
				'x-access-token': cookies.get('session')
			}
		}).then((r) => r.json()),
		trips: await fetch(`${PUBLIC_REST_API_URL}/admin/trips/limit/5/offset/0`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-access-token': cookies.get('session')
			},
			body: JSON.stringify({ user_id: params.slug })
		}).then((r) => r.json())
	};
};
