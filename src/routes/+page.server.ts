import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	if (typeof cookies.get('session') === 'string') {
		// attempt to redirect logged in users to the dashboard
		throw redirect(302, '/admin/dashboard');
	}

	throw redirect(302, '/login');
};
