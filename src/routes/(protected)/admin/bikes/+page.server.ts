import type { Action, Actions } from './$types';
import type { PageServerLoad } from './$types';
import { PUBLIC_REST_API_URL } from '$env/static/public';

import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	return {
		bikes: await fetch(`${PUBLIC_REST_API_URL}/bikes`, {
			method: 'GET'
		}).then((r) => r.json())
	};
};

const stop: Action = async ({ request }) => {
	const data = await request.formData();

	const id = data.get('id'); // this is the id of the bike to stop

	if (typeof id !== 'string' || !id) {
		return fail(400, { invalid: true }); // use this in the client to show an error message
	}

	// TODO: stop the bike with the given id

	console.log(id); // temporary until we implement the above
};

export const actions: Actions = { stop };
