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

	const bikeId = data.get('id');

	if (typeof bikeId !== 'string' || !bikeId) {
		return fail(400, { invalid: true });
	}

	try {
		const response = await fetch(`${PUBLIC_REST_API_URL}/admin/bikes/${bikeId}/deactivate`, {
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

const activate: Action = async ({ request, cookies }) => {
	const data = await request.formData();

	const bikeId = data.get('id');

	if (typeof bikeId !== 'string' || !bikeId) {
		return fail(400, { invalid: true });
	}

	try {
		const response = await fetch(`${PUBLIC_REST_API_URL}/admin/bikes/${bikeId}/activate`, {
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

const changeStatus: Action = async ({ request, cookies }) => {
	const data = await request.formData();

	const bikeId = data.get('id');
	const statusId = data.get('status');

	if (typeof bikeId !== 'string' || !bikeId || typeof statusId !== 'string' || !statusId) {
		return fail(400, { invalid: true });
	}

	console.log(bikeId, statusId);
	let result;
	try {
		const response = await fetch(
			`${PUBLIC_REST_API_URL}/admin/bikes/${bikeId}/status/${statusId}`,
			{
				method: 'PUT',
				headers: {
					'x-access-token': cookies.get('session')
				}
			}
		);

		result = await response.json();

		if (!response.ok) {
			console.error(result.errors.message);

			return fail(response.status, { invalid: true, message: result.errors.message });
		}
	} catch (error) {
		console.error(error);

		return fail(500, { invalid: true, message: error.message });
	}

	return { success: true };
};

export const actions: Actions = { deactivate, activate, changeStatus };
