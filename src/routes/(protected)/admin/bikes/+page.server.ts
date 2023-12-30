import type { Action, Actions } from './$types';
import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	return {
		bikes: await fetch(`${PUBLIC_REST_API_URL}/bikes`, {
			method: 'GET'
		}).then((r) => r.json())
	};
};

const deactivate: Action = async ({ request, cookies }) => {
	const data = await request.formData();

	const id = data.get('id');

	if (typeof id !== 'string' || !id) {
		return fail(400, { invalid: true });
	}

	try {
		const response = await fetch(`${PUBLIC_REST_API_URL}/admin/bikes/${id}/deactivate`, {
			method: 'PUT',
			headers: {
				'x-access-token': cookies.get('session')
			}
		});

		if (!response.ok) {
			const result = await response.json();

			console.error(result.errors.message);

			return fail(response.status, { invalid: true, message: result.errors.message });
		}
	} catch (error) {
		console.error(error);

		return fail(500, { invalid: true, message: error.message });
	}

	return { success: true };
};

export const actions: Actions = { deactivate };
