function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

interface AnimatedPointCallback {
	(animatedPoint: [number, number]): void;
}

export const animateToPoint = (
	startPoint: [number, number],
	endPoint: [number, number],
	duration: number,
	callback: AnimatedPointCallback
) => {
	// set start to a zero value, which is equivalent to the 0th frame of the animation
	// (this lines up with the timeStamp argument in the requestAnimationFrame function)
	const start = document.timeline.currentTime;

	function animate(currentTime: number) {
		// @ts-expect-error – start should be a number
		const elapsed = currentTime - start;
		const progress = elapsed / duration;

		if (progress < 1) {
			const animatedPoint: [number, number] = [
				lerp(startPoint[0], endPoint[0], progress),
				lerp(startPoint[1], endPoint[1], progress)
			];

			callback(animatedPoint); // draw the in-between points

			// call function before the next repaint.
			requestAnimationFrame((t) => animate(t));
		} else {
			// Animation complete
			callback(endPoint); // draw the end point
		}
	}
	// call function before the next repaint.
	requestAnimationFrame(animate);
};
