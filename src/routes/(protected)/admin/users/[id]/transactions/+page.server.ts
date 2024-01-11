import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, params }) => {
	return {
		transactions: await fetch(`${PUBLIC_REST_API_URL}/admin/transactions`, {
			method: 'POST',
			body: JSON.stringify({ user_id: params.id })
		}).then((r) => r.json())
	};
};
