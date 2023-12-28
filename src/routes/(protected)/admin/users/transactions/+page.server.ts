import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	return {
		transactions: await fetch(`${PUBLIC_REST_API_URL}/admin/transactions/all`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-access-token': cookies.get('session')
			}
		}).then((r) => r.json())
	};
};
