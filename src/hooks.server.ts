import type { Handle } from '@sveltejs/kit';
import type { HandleFetch } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { jwtDecode } from 'jwt-decode';
import type { CustomJwtPayload } from './lib/types/CustomJwtPayload';
import { PRIVATE_REST_API_KEY } from '$env/static/private';

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

	return await resolve(event); // <-- all good, allow the request to proceed
};

export const handleFetch: HandleFetch = async ({ request, fetch }) => {
	request.headers.set('x-api-key', PRIVATE_REST_API_KEY);

	return fetch(request);
};
