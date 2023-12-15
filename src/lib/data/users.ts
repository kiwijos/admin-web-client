export const generateUsers = (numUsers: number) => {
	const users = [];
	for (let i = 0; i < numUsers; i++) {
		users.push({
			id: i,
			email: randomEmail(),
			card_nr: randomCardNumber(),
			card_type: randomCardType(),
			balance: randomBalance()
		});
	}
	return users;
};

function randomCardNumber(): string {
	return `${Math.floor(Math.random() * 10000)} **** **** ****`;
}

function randomCardType(): string {
	const cardTypes = ['Visa', 'Mastercard', 'American Express', 'Discover'];
	return cardTypes[Math.floor(Math.random() * cardTypes.length)];
}

// random email generator, picks a random name, and a random domain and a random extension
function randomEmail(): string {
	const names = [
		'john',
		'jane',
		'jim',
		'jill',
		'joe',
		'jess',
		'josh',
		'jake',
		'jenny',
		'joseph',
		'julian',
		'jocelyn'
	];
	const domains = ['gmail', 'yahoo', 'hotmail', 'aol', 'outlook', 'icloud', 'protonmail', 'zoho'];
	const extensions = [
		'com',
		'net',
		'org',
		'edu',
		'gov',
		'io',
		'co.uk',
		'xyz',
		'tech',
		'biz',
		'info',
		'me',
		'us'
	];

	const name = names[Math.floor(Math.random() * names.length)];
	const domain = domains[Math.floor(Math.random() * domains.length)];
	const extension = extensions[Math.floor(Math.random() * extensions.length)];

	return `${name}@${domain}.${extension}`;
}

// random balance generator, picks a random number between -1000 and 1000
function randomBalance(): number {
	return Math.floor(Math.random() * 2000) - 1000;
}
