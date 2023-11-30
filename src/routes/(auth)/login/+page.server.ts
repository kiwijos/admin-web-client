import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';

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

	cookies.set('session', email, {
		path: '/',
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 * 30
	});

	// redirect the user
	throw redirect(302, '/admin/dashboard');
};

export const actions: Actions = { login };
