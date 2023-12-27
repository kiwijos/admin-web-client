import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		// redirect logged in users to the dashboard
		throw redirect(302, '/admin/dashboard');
	}
};

const login: Action = async ({ cookies, request }) => {
	const data = await request.formData();

	const email = data.get('email');
	const password = data.get('password');

	if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
		return fail(400, { invalid: true });
	}

	try {
		const response = await fetch(`${PUBLIC_REST_API_URL}/login/admin`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username: email, password: password })
		});

		const result = await response.json();

		const token = result.data.token;

		cookies.set('session', token, {
			path: '/',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(302, '/admin/dashboard');
	} catch (error) {
		console.error(error);
		return fail(500, { error: true });
	}
};

export const actions: Actions = { login };
