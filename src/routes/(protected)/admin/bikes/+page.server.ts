import type { Action, Actions } from './$types';
import { fail } from '@sveltejs/kit';

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
