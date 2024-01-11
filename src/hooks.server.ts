import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { jwtDecode } from 'jwt-decode';
import type { CustomJwtPayload } from './lib/types/CustomJwtPayload';

export const handle: Handle = async ({ event, resolve }) => {
	// ONLY RUN this hook for admin pages (e.g. /admin/dashboard, /admin/users)
	// DON'T RUN this hook for the auth pages (e.g. /login, /logout) or the root page (/)
	if (!event.url.pathname.startsWith('/admin')) {
		return await resolve(event);
	}

	const token = event.cookies.get('access_token');

	// Redirect early to login page if the user is not logged in
	if (typeof token !== 'string' || !token) {
		// Sometimes the user object is still in the request locals, for example if:
		// 	- the cookie expired
		// 	- the cookie was removed manually (e.g. via the browser dev tools)
		// The user object is only explicitly set to null when:
		// 	- the user logs out via /logout
		// 	- the token check fails (e.g. invalid or expired token)
		event.locals.signed_in_as = null; // <-- make sure the user object `signed_in_as` is null in any case

		// Resolve the request "as normal" if the user is not trying to access the admin pages
		if (!event.url.pathname.startsWith('/admin')) {
			return await resolve(event);
		}

		throw redirect(302, '/login');
	}

	try {
		const decoded: CustomJwtPayload = jwtDecode(token);

		const exp = decoded.exp as number;
		const date = new Date(0);
		date.setUTCSeconds(exp);

		if (date < new Date()) throw new Error('Token expired');

		// Valid token, pass on the user object via the request locals
		event.locals.signed_in_as = {
			id: decoded.id
		};
	} catch (error) {
		console.error(error);

		// Invalid token, force the user to log in again
		event.locals.signed_in_as = null;
		event.cookies.delete('access_token', { path: '/' });
		throw redirect(302, '/login');
	}

	if (event.url.pathname === '/login' || event.url.pathname === '/') {
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

	return await resolve(event); // <-- all good, allow the request to proceed
};
