import type { LayoutServerLoad } from './$types';

// pass `locals.user` to the `page` store for use inside client-side code
export const load: LayoutServerLoad = async ({ params }) => {
	return {
		id: params.slug
	};
};
