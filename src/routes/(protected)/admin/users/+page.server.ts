import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, depends }) => {
	depends('server:fetchUsers');
	return {
		users: await fetch(`${PUBLIC_REST_API_URL}/admin/users`).then((r) => r.json())
	};
};
