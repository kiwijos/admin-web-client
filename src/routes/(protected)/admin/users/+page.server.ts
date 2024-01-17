import type { PageServerLoad } from './$types';
import type { Action, Actions } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch, depends }) => {
	depends('server:fetchUsers');
	return {
		users: await fetch(`${PUBLIC_REST_API_URL}/admin/users`).then((r) => r.json())
	};
};

const fileInvoice: Action = async ({ fetch }) => {
	let result;

	try {
		const response = await fetch(`${PUBLIC_REST_API_URL}/admin/users/invoice`, {
			method: 'PUT'
		});

		result = await response.json();

		if (!response.ok) {
			console.error(result.errors.message);

			return fail(response.status, {
				error: true,
				message: 'Kunde inte fakturera användare på grund av ett serverfel.'
			});
		}
	} catch (error) {
		let message;
		if (error instanceof Error) message = error.message;
		else message = String(error);

		console.error(message);

		return fail(500, {
			error: true,
			message: 'Kunde inte fakturera användare på grund av ett serverfel.'
		});
	}

	return { success: true, invoiceData: result };
};

const updateStatus: Action = async ({ request, fetch }) => {
	const data = await request.formData();

	const activeString = data.get('active');
	const userId = data.get('userId');

	if (typeof activeString !== 'string' || !activeString) {
		return fail(400, { activeString, invalid: true });
	}

	if (typeof userId !== 'string' || !userId) {
		return fail(400, { userId, invalid: true });
	}

	const active = activeString === 'true';

	let result;

	try {
		const response = await fetch(`${PUBLIC_REST_API_URL}/admin/users/${userId}/status`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ active })
		});

		result = await response.json();

		if (!response.ok) {
			console.error(result.errors.message);

			return fail(response.status, {
				error: true,
				message: 'Kunde inte uppdatera status på användaren på grund av ett serverfel.'
			});
		}
	} catch (error) {
		let message;
		if (error instanceof Error) message = error.message;
		else message = String(error);

		console.error(message);

		return fail(500, {
			error: true,
			message: 'Kunde inte uppdatera status på användaren på grund av ett serverfel.'
		});
	}

	return { success: true, user: result };
};

export const actions: Actions = { fileInvoice, updateStatus };
