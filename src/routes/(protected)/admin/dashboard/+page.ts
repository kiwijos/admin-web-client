import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const features = [
		{
			heading: 'Map Feature',
			title: 'View Bikes in Real Time',
			description:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel urna eget massa aliquet ultrices. Donec euismod, nisl eget aliquam ultricies, nisl nisl aliquet nisl, eget aliquam nisl nisl eget nisl. ',
			image: '',
			link: '/admin/map'
		},

		{
			heading: 'Analysis',
			title: 'Transactions this Month',
			description:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel urna eget massa aliquet ultrices. Donec euismod, nisl eget aliquam ultricies, nisl nisl aliquet nisl, eget aliquam nisl nisl eget nisl. ',
			image: '',
			link: '/admin/stats/transactions'
		}
	];

	return { features };
};
