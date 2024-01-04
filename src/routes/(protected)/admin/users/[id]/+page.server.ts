import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, fetch, params }) => {
	const { id } = params;
	const accessToken = cookies.get('access_token');

	return {
		user: await fetch(`${PUBLIC_REST_API_URL}/admin/users/${params.id}`, {
			method: 'GET',
			// @ts-expect-error - We are aware that 'x-access-token' is not typed
			headers: {
				'x-access-token': accessToken
			}
		}).then((r) => r.json()),
		trips: await fetch(`${PUBLIC_REST_API_URL}/admin/trips/limit/5/offset/0`, {
			method: 'POST',
			// @ts-expect-error - We are aware that 'x-access-token' is not typed
			headers: {
				'x-access-token': accessToken
			},
			body: JSON.stringify({ user_id: id })
		}).then((r) => r.json()),
		transactions: await fetch(`${PUBLIC_REST_API_URL}/admin/transactions/limit/5/offset/0`, {
			method: 'POST',
			// @ts-expect-error - We are aware that 'x-access-token' is not typed
			headers: {
				'x-access-token': accessToken
			},
			body: JSON.stringify({ user_id: id })
		}).then((r) => r.json())
	};
};
