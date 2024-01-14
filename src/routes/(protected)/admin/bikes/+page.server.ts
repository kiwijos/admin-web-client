import type { Action, Actions } from './$types';
import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch }) => {
	return {
		bikes: await fetch(`${PUBLIC_REST_API_URL}/bikes`).then((r) => r.json())
	};
};

const simulate: Action = async ({ fetch }) => {
	try {
		const response = await fetch(`${PUBLIC_REST_API_URL}/admin/simulate`);

		if (!response.ok) {
			const result = await response.json();

			console.error(result.errors.message);

			return fail(response.status, {
				error: true,
				message: 'Simuleringen kunde inte startas på grund av ett serverfel.'
			});
		}
	} catch (e) {
		let message;
		if (e instanceof Error) message = e.message;
		else message = String(e);

		return fail(500, { error: true, message });
	}

	return { success: true };
};

const deactivate: Action = async ({ request, fetch }) => {
	const data = await request.formData();

	const bikeId = data.get('id');

	if (typeof bikeId !== 'string' || !bikeId) {
		return fail(400, { bikeId, invalid: true });
	}

	let result;

	try {
		const response = await fetch(`${PUBLIC_REST_API_URL}/admin/bikes/${bikeId}/deactivate`, {
			method: 'PUT'
		});

		result = await response.json();

		if (!response.ok) {
			console.error(result.errors.message);

			return fail(response.status, {
				error: true,
				message: 'Kunde inte stoppa cykeln på grund av ett serverfel.'
			});
		}
	} catch (error) {
		let message;
		if (error instanceof Error) message = error.message;
		else message = String(error);

		console.error(message);

		return fail(500, {
			error: true,
			message: 'Kunde inte stoppa cykeln på grund av ett serverfel.'
		});
	}

	return { success: true, bike: result.bike };
};

const activate: Action = async ({ request, fetch }) => {
	const data = await request.formData();

	const bikeId = data.get('id');

	if (typeof bikeId !== 'string' || !bikeId) {
		return fail(400, { bikeId, invalid: true });
	}

	let result;

	try {
		const response = await fetch(`${PUBLIC_REST_API_URL}/admin/bikes/${bikeId}/activate`, {
			method: 'PUT'
		});

		result = await response.json();

		if (!response.ok) {
			console.error(result.errors.message);

			return fail(response.status, {
				invalid: true,
				message: 'Kunde inte aktivera cykeln på grund av ett serverfel.'
			});
		}
	} catch (error) {
		let message;
		if (error instanceof Error) message = error.message;
		else message = String(error);

		console.error(message);

		return fail(500, {
			invalid: true,
			message: 'Kunde inte aktivera cykeln på grund av ett serverfel.'
		});
	}

	return { success: true, bike: result };
};

const changeStatus: Action = async ({ request, fetch }) => {
	const data = await request.formData();

	const bikeId = data.get('id');
	const statusId = data.get('status');

	if (typeof bikeId !== 'string' || !bikeId || typeof statusId !== 'string' || !statusId) {
		return fail(400, { invalid: true });
	}

	let result;

	try {
		const response = await fetch(
			`${PUBLIC_REST_API_URL}/admin/bikes/${bikeId}/status/${statusId}`,
			{
				method: 'PUT'
			}
		);

		result = await response.json();

		if (!response.ok) {
			console.error(result.errors.message);

			return fail(response.status, {
				error: true,
				message: 'Kunde inte ändra status på grund av ett serverfel.'
			});
		}
	} catch (error) {
		let message;
		if (error instanceof Error) message = error.message;
		else message = String(error);

		console.error(message);

		return fail(500, {
			error: true,
			message: 'Kunde inte ändra status på grund av ett serverfel.'
		});
	}

	return { success: true, bike: result };
};

export const actions: Actions = { simulate, deactivate, activate, changeStatus };
