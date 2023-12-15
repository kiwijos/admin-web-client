export const generateRandomPointInSweden = (): [number, number] => {
	// define the latitude and longitude ranges for Sweden
	const swedenLatitudeRange = [55.34, 69.06];
	const swedenLongitudeRange = [11.16, 24.16];

	// generate random latitude and longitude within the specified ranges
	const latitude =
		Math.random() * (swedenLatitudeRange[1] - swedenLatitudeRange[0]) + swedenLatitudeRange[0];
	const longitude =
		Math.random() * (swedenLongitudeRange[1] - swedenLongitudeRange[0]) + swedenLongitudeRange[0];

	return [longitude, latitude];
};

export const generatePointWithinRadius = (
	centerPoint: [number, number],
	radiusInMeters: number
): [number, number] => {
	// earth radius in meters
	const earthRadius = 6371000;

	// convert latitude and longitude from degrees to radians
	const centerLatRad = centerPoint[1] * (Math.PI / 180);
	const centerLngRad = centerPoint[0] * (Math.PI / 180);

	// generate a random angle in radians
	const randomAngle = Math.random() * 2 * Math.PI;

	// calculate the distance (in radians) from the center within the given radius
	const distance = (Math.sqrt(Math.random()) * radiusInMeters) / earthRadius;

	// calculate the new latitude and longitude
	const newLatRad = centerLatRad + distance * Math.cos(randomAngle);
	const newLngRad = centerLngRad + distance * Math.sin(randomAngle);

	// convert the new latitude and longitude back to degrees
	const newLatitude = newLatRad * (180 / Math.PI);
	const newLongitude = newLngRad * (180 / Math.PI);

	return [newLongitude, newLatitude];
};
