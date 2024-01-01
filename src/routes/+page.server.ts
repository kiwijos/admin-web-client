import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	if (typeof cookies.get('access_token') === 'string') {
		// Attempt to redirect users with the cookie to the dashboard
		// The cookie works as a proxy for the user being logged in, albeit not totally reliable
		// If the user is NOT logged in, the hook will redirect to the login page
		// This is a workaround for the fact that the auth check only runs before /admin pages, not the root route (/)
		//
		// There are a couple of cases where the user might have a cookie but is not logged in:
		// 	- the token inside the cookie expired
		// 	- the cookie was set manually (e.g. via the browser dev tools) to an invalid value
		// 	- the token inside the cookie is invalid for some other reason
		throw redirect(302, '/admin/dashboard');
	}

	throw redirect(302, '/login');
};
