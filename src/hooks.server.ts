import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { jwtDecode } from 'jwt-decode';

export const handle: Handle = async ({ event, resolve }) => {
	// ONLY RUN this hook for admin pages (e.g. /admin/dashboard, /admin/users)
	// DON'T RUN this hook for the auth pages (e.g. /login, /logout)
	if (!event.url.pathname.startsWith('/admin')) {
		return await resolve(event);
	}

	const token = event.cookies.get('session');

	// Redirect early to login page if the user is not logged in
	if (typeof token !== 'string' || !token) {
		// Sometimes the user object is still in the request locals, for example if:
		// 	- the cookie expired
		// 	- the cookie was removed manually (e.g. via the browser dev tools)
		// The user object is only explicitly set to null when:
		// 	- the user logs out via /logout
		// 	- the token check fails (e.g. invalid or expired token)
		event.locals.signed_in_as = null; // <-- make sure the user object is null in any case
		throw redirect(302, '/login');
	}

	try {
		const decoded: JwtPayload = jwtDecode(token);

		const exp = decoded.exp;
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
		event.cookies.delete('session', { path: '/' });
		throw redirect(302, '/login');
	}

	return await resolve(event); // <-- all good, allow the request to proceed
};
