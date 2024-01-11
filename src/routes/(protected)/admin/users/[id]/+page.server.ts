import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const { id } = params;

	return {
		user: await fetch(`${PUBLIC_REST_API_URL}/admin/users/${params.id}`).then((r) => r.json()),
		trips: await fetch(`${PUBLIC_REST_API_URL}/admin/trips/limit/5/offset/0`, {
			method: 'POST',
			body: JSON.stringify({ user_id: id })
		}).then((r) => r.json()),
		transactions: await fetch(`${PUBLIC_REST_API_URL}/admin/transactions/limit/5/offset/0`, {
			method: 'POST',
			body: JSON.stringify({ user_id: id })
		}).then((r) => r.json())
	};
};
