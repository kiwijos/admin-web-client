import type { AnimatedPointCallback } from '$lib/types/AnimatedPointCallback';

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

export const animateToPoint = (
	startPoint: [number, number],
	endPoint: [number, number],
	duration: number,
	fps: number,
	callback: AnimatedPointCallback
) => {
	// set start to a zero value, which is equivalent to the 0th frame of the animation
	// (this lines up with the timeStamp argument in the requestAnimationFrame function)
	const start = document.timeline.currentTime;

	function animate(currentTime: number) {
		// @ts-expect-error – start should be a number (hopefully)
		const elapsed = currentTime - start;
		const progress = elapsed / duration;

		setTimeout(() => {
			if (progress < 1) {
				const animatedPoint: [number, number] = [
					lerp(startPoint[0], endPoint[0], progress),
					lerp(startPoint[1], endPoint[1], progress)
				];

				callback(animatedPoint); // draw the in-between points

				// call function before the next repaint
				requestAnimationFrame((t) => animate(t));
			} else {
				// Animation complete
				callback(endPoint); // draw the end point
			}
		}, 1000 / fps);
	}
	// call function before the next repaint
	requestAnimationFrame(animate);
};
