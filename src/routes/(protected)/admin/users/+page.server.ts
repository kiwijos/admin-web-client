import type { PageServerLoad } from './$types';
import { generateUsers } from '$lib/data/users';

export const load: PageServerLoad = async () => {
	return {
		props: {
			users: generateUsers(100)
		}
	};
};
