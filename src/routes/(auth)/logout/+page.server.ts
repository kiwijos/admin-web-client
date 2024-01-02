import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	throw redirect(302, '/');
};

export const actions: Actions = {
	default({ locals, cookies }) {
		cookies.delete('access_token', { path: '/' });
		locals.signed_in_as = null;

		throw redirect(302, '/login');
	}
};
