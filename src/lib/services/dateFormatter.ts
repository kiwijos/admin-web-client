export const calculateTimeDifference = (startDate: string, endDate: string): string => {
	const start = new Date(startDate);
	const end = new Date(endDate);

	// @ts-expect-error - TS doesn't like the subtraction of dates but it works
	const timeDifference = end - start; // Difference in milliseconds

	// Convert milliseconds to minutes
	const minutes = Math.floor(timeDifference / (1000 * 60));

	if (minutes < 60) {
		return `${minutes} min`;
	} else {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return `${hours} h, ${remainingMinutes} min`;
	}
};

export const formatDateReadable = (date: string): string => {
	const d = new Date(date);
	return d.toLocaleDateString('sv-SE', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: false // Use 24-hour format
	});
};
