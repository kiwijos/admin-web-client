import type { Handle } from '@sveltejs/kit';
import { jwtDecode } from 'jwt-decode';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session');

	// Resolve early if there's no token to check
	if (typeof token !== 'string' || !token) {
		// Sometimes the user object is still in the request locals, for example if:
		// 	- the cookie expired
		// 	- the cookie was removed manually (e.g. via the browser dev tools)
		// The user object is only explicitly set to null when:
		// 	- the user logs out via /logout
		// 	- the token check fails (e.g. invalid or expired token)
		event.locals.user = null;
		return await resolve(event);
	}

	try {
		const decoded: JwtPayload = jwtDecode(token);

		const exp = decoded.exp;
		const date = new Date(0);
		date.setUTCSeconds(exp);

		if (date < new Date()) throw new Error('Token expired');

		// Valid token, pass on the user object via the request locals
		event.locals.user = {
			id: decoded.id
		};
	} catch (error) {
		console.error(error);

		// Invalid token, force the user to log in again
		event.locals.user = null;
		event.cookies.delelte('session', { path: '/' });
	}

	return await resolve(event);
};
