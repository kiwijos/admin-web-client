import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, fetch, params }) => {
	return {
		transactions: await fetch(`${PUBLIC_REST_API_URL}/admin/transactions`, {
			method: 'POST',
			// @ts-expect-error - We are aware that 'x-access-token' is not typed
			headers: {
				'x-access-token': cookies.get('access_token')
			},
			body: JSON.stringify({ user_id: params.id })
		}).then((r) => r.json())
	};
};
