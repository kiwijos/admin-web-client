import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const email = event.cookies.get('session');

	// Add the user's email to the request
	if (email) event.locals.user = { email };

	return await resolve(event);
};
