import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies }) => {
	if (typeof cookies.get('session') === 'string') {
		// attempt to redirect logged in users to the dashboard
		throw redirect(302, '/admin/dashboard');
	}
};

const login: Action = async ({ cookies, request, fetch }) => {
	const data = await request.formData();

	const username = data.get('username');
	const password = data.get('password');

	if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
		return fail(400, { invalid: true, message: 'Ange både användarnamn och lösenord' });
	}

	let token: string | undefined;

	try {
		const response = await fetch(`${PUBLIC_REST_API_URL}/login/admin`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username, password })
		});

		if (!response.ok) {
			// Handle non-successful responses
			const result = await response.json();

			if (response.status === 401) {
				// Unauthorized - wrong password
				console.warn(result.errors.detail);
				return fail(401, {
					invalid: true,
					message: 'Lösenordet stämmer inte med användarnamnet, försök igen'
				});
			} else {
				// Other errors (e.g., server errors)
				console.error(result.errors.detail);
				return fail(500, {
					error: true,
					message: 'Hittade inte användaren, försök igen'
				});
			}
		}

		const result = await response.json();

		token = result?.data?.token;

		if (typeof token !== 'string' || !token) {
			console.error('Unexpected response structure or no token');
			return fail(500, { error: true, message: 'Något gick fel hos servern, försök igen senare' });
		}
	} catch (error) {
		// Handle fetch or other unexpected errors
		console.error(error);
		return fail(500, {
			error: true,
			message: 'Något gick fel med förfrågan till servern, försök igen senare'
		});
	}

	cookies.set('access_token', token, {
		path: '/',
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 * 30
	});

	throw redirect(302, '/admin/dashboard');
};

export const actions: Actions = { login };
