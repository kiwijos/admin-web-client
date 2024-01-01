import type { LayoutServerLoad } from './$types';

// pass `locals.user` to the `page` store for use inside client-side code
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		signed_in_as: locals.signed_in_as
	};
};
