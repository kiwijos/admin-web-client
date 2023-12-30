import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	return {
		users: await fetch(`${PUBLIC_REST_API_URL}/admin/users`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-access-token': cookies.get('session')
			}
		}).then((r) => r.json())
	};
};
