import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, fetch, params }) => {
	return {
		transactions: await fetch(`${PUBLIC_REST_API_URL}/admin/transactions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-access-token': cookies.get('session')
			},
			body: JSON.stringify({ user_id: params.slug })
		}).then((r) => r.json())
	};
};
