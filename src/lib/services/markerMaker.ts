import type { BikePointFeature } from '$lib/types/BikePointFeature';
import { statusCodes } from '$lib/help/statusCodes';
import type { ZonePolygonFeature } from '$lib/types/ZonePolygonFeature';

export const createBikeCountPin = (props: ZonePolygonFeature['properties']): HTMLElement => {
	const count = props.bike_count;
	const zoneId = props.zone_id;

	if (!count || !zoneId) return document.createElement('div');

	let markerFill = '';
	let markerBorder = '';

	if (zoneId === 1) {
		markerFill = 'bg-blue-400 dark:bg-blue-600';
		markerBorder = 'border-blue-500 dark:border-blue-700';
	} else if (zoneId === 2) {
		markerFill = 'bg-emerald-400 dark:bg-emerald-600';
		markerBorder = 'border-emerald-500 dark:border-emerald-700';
	} else if (zoneId === 3) {
		markerFill = 'bg-red-400 dark:bg-red-600';
		markerBorder = 'border-red-500 dark:border-red-700';
	}

	const pinSize = 30; // Adjust the size of the pin
	const svgPathSize = 16; // Adjust the size of the inner SVG
	const bikeStroke = 'fill-token'; // Replace with the desired stroke color

	const svgMarkup = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${pinSize}" height="${pinSize}" viewBox="0 0 ${pinSize} ${pinSize}" fill="none">

            <!-- Inner SVG  -->
            <svg x="${(pinSize - svgPathSize) / 2}" y="${
							(pinSize - svgPathSize) / 2
						}" width="${svgPathSize}" height="${svgPathSize}" viewBox="0 0 ${pinSize} ${pinSize}" fill="none">
                <!-- Bike icon SVG -->
                <path d="M8.014 5H12a1 1 0 1 1 0 2H8.905l-.998 9.983l5.666 6.918A3 3 0 0 0 15.894 25h6.232A4.002 4.002 0 0 1 30 26a4 4 0 0 1-7.874 1h-6.232a5 5 0 0 1-3.868-1.832l-4.4-5.373l-.245 2.45A4.002 4.002 0 0 1 6 30a4 4 0 0 1-.61-7.954L7.004 5.911a.994.994 0 0 1 .65-.85a.994.994 0 0 1 .36-.061M5.177 24.177a2 2 0 1 0 1.99.199l-.172 1.723a1 1 0 0 1-1.99-.199zM24.267 27a2 2 0 1 0 0-2H26a1 1 0 1 1 0 2z" class="${bikeStroke}" fill="currentColor"/>
            </svg>
        </svg>
    `;

	const fullMarkup = `
        <div class="relative grid grid-cols-2 items-center justify-center text-center rounded-full border ${markerBorder} ${markerFill}">
            ${svgMarkup}
            <span class="inline-block border-l ${markerBorder} font-bold text-xs text-token">${count}</span>
            <div
                class="inset-x-2/4 absolute bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 border-r border-b ${markerBorder} ${markerFill}"
            ></div>
        </div>`;

	const el = document.createElement('button');
	el.classList.add('cursor-pointer', 'btn', 'focus:ring-2', 'transition-none');

	el.innerHTML = fullMarkup;

	return el;
};

export const createBikePin = (): HTMLElement => {
	const pinSize = 32; // Adjust the size of the pin
	const circleRadius = 14; // Adjust the radius of the outer circle
	const svgPathSize = 16; // Adjust the size of the inner SVG
	const circleFill = 'fill-sky-400 dark:fill-sky-600'; // Replace with the desired fill color
	const circleStroke = 'white'; // Replace with the desired stroke color
	const bikeStroke = 'fill-token'; // Replace with the desired stroke color

	const svgMarkup = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${pinSize}" height="${pinSize}" viewBox="0 0 ${pinSize} ${pinSize}" fill="none">
            <!-- Outer circle -->
            <circle cx="${pinSize / 2}" cy="${
							pinSize / 2
						}" r="${circleRadius}" stroke="${circleStroke}" stroke-width="1" fill="none" class="${circleFill}" />

            <!-- Inner SVG with transparent background -->
            <svg x="${(pinSize - svgPathSize) / 2}" y="${
							(pinSize - svgPathSize) / 2
						}" width="${svgPathSize}" height="${svgPathSize}" viewBox="0 0 ${pinSize} ${pinSize}" fill="none">
                <!-- Bike icon SVG -->
                <path d="M8.014 5H12a1 1 0 1 1 0 2H8.905l-.998 9.983l5.666 6.918A3 3 0 0 0 15.894 25h6.232A4.002 4.002 0 0 1 30 26a4 4 0 0 1-7.874 1h-6.232a5 5 0 0 1-3.868-1.832l-4.4-5.373l-.245 2.45A4.002 4.002 0 0 1 6 30a4 4 0 0 1-.61-7.954L7.004 5.911a.994.994 0 0 1 .65-.85a.994.994 0 0 1 .36-.061M5.177 24.177a2 2 0 1 0 1.99.199l-.172 1.723a1 1 0 0 1-1.99-.199zM24.267 27a2 2 0 1 0 0-2H26a1 1 0 1 1 0 2z" fill="currentColor" class="${bikeStroke}"/>
            </svg>
        </svg>
    `;

	const el = document.createElement('button');
	el.classList.add('cursor-pointer', 'btn-icon', 'focus:ring-2', 'transition-none');

	el.innerHTML = svgMarkup;

	return el;
};

export const singleBikeFormPopupHTML = (feature: BikePointFeature) => {
	const linkTitle = 'Öppna sidan för cykeln i en ny flik';

	const chargPerc = feature.properties.charge_perc;
	const batteryColor =
		chargPerc <= 0.15 ? 'text-red-500' : chargPerc <= 0.4 ? 'text-yellow-400' : 'text-green-500';

	const statusId = feature.properties?.status_id;

	const buttonHTML = feature.properties.active
		? `
            <button
            aria-describedby="stop-bike-form"
            form="stop-bike-form"
            type="submit"
            class="font-xs text-red-500 hover:bg-red-500/30 hover:text-red-700 px-2 py-1 rounded-md"
            >Stoppa</button
        >`
		: `
            <button
            aria-describedby="start-bike-form"
            form="start-bike-form"
            type="submit"
            class="font-xs text-green-700 bg-green-50 dark:bg-green-200 hover:bg-green-100 dark:hover:bg-green-300 dark:text-green-700 dark:hover:text-green-800 px-2 py-1 rounded-md"
            >Starta</button
        >`;

	return `
			<div class="flex flex-col divide-y divide-gray-100 dark:divide-surface-600 min-w-56">
				<div class="px-2 pt-8 pb-4">
					<table class="w-full text-surface-500 dark:text-surface-300 border border-gray-100 dark:border-0">
						<tbody class="overflow-y-scroll text-xs">
							<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Cykelnr.</span></td>
								</td>
								<td class="p-2">${feature.properties.id}</td>
							</tr>
							<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Batteri</span></td>
								</td>
								<td class="p-2">${Math.round(chargPerc * 100)}% <span class="text-xs ${batteryColor}">■</span></td>
							</tr>
							<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Hastighet</span></td>
								</td>
								<td class="p-2">${feature.properties.speed} km/h</td>
							</tr>
							<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Latitud</span></td>
								</td>
								<td class="p-2">${feature.geometry.coordinates[1].toFixed(4)}</td>
							</tr>
							<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Longitud</span></td>
								</td>
								<td class="p-2">${feature.geometry.coordinates[0].toFixed(4)}</td>
							</tr>
                            <tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Status</span></td>
								</td>
								<td class="p-2">${statusId ? statusCodes[statusId] : '--'}</td>
							</tr>
							 <tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
								<td class="p-2"><span class="font-bold">Aktiv</span></td>
								</td>
								<td class="p-2">${
									feature.properties.active === true
										? 'Ja'
										: feature.properties.active === false
											? 'Nej'
											: '--'
								}</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="flex flex-row justify-between px-2 pt-4 pb-2">	
					<a title="${linkTitle}" href="/admin/bikes/${
						feature.properties.id
					}" target="_blank" class="block after:content-['_↗'] font-xs text-surface-700 bg-gray-50 dark:bg-surface-600 hover:bg-gray-100 dark:hover:bg-surface-700 dark:text-surface-100 dark:hover:text-white px-2 py-1 rounded-md">Mer info</a>
					${buttonHTML}
				</div>
			</div>
		`;
};

const chargeMeterHTML = (chargePerc: number, height: string, label: boolean): string => {
	const meterHeight = height ?? 'h-4';
	const colorLow: string = 'bg-red-500';
	const colorMedium: string = 'bg-yellow-400';
	const colorHigh: string = 'bg-green-500';

	const bgLow: string = `${colorLow}/30`;
	const bgMedium: string = `${colorMedium}/30`;
	const bgHigh: string = `${colorHigh}/30`;

	const value = chargePerc * 100;

	let color;
	let bg;
	if (value <= 15) {
		color = colorLow;
		bg = bgLow;
	} else if (value <= 40) {
		color = colorMedium;
		bg = bgMedium;
	} else {
		color = colorHigh;
		bg = bgHigh;
	}

	const batteryText = label ? 'text-center text-xs font-bold text-surface-800' : '';

	return `
		<div class="w-full ${meterHeight} ${bg} grid grid-cols-1 grid-rows-1 rounded-full">
					<div class="${color} ${meterHeight} leading-none rounded-full" style="width: ${value}%"></div>
					${label ? `<p class="${batteryText}">${value}%</p>` : ''}
				</div>
	`;
};

export const singleBikeCardPopupHTML = (feature: BikePointFeature): string => {
	const props = feature.properties;
	const coordinates = feature.geometry.coordinates;

	const linkTitle = 'Öppna sidan för cykeln i en ny flik';
	const statusId = props?.status_id;

	return `
			<div class="min-w-56 px-2 pt-6 pb-4 space-y-2">
				<a class="group rounded-sm flex gap-2 p-2 border-b-2 border-gray-100 hover:border-gray-300 dark:border-surface-600 hover:dark:border-surface-500" title="${linkTitle}" href="/admin/bikes/${
					props.id
				}" target="_blank">
					<div class="grow">
						<p class="text-base ">Cykelnr ${props.id}</p>
						<p class="text-xs text-gray-500 dark:text-surface-300">${props.active ? 'Aktiv' : 'Avstängd'} (${
							statusCodes[statusId]
						})</p>
						<p class="text-xs text-gray-500 dark:text-surface-300">Lat. ${coordinates[1].toFixed(
							4
						)}, Lon. ${coordinates[0].toFixed(4)}</p>
					</div>
					<div class="my-auto group-hover:text-surface-700 group-hover:dark:text-white text-gray-500 dark:text-surface-300 text-2xl">
						↗
					</div>
				</a>
				${chargeMeterHTML(props.charge_perc, 'h-4', true)}
			</div>
		`;
};

export const multipleBikeCardsPopupHTML = (feature: ZonePolygonFeature): string => {
	const props = feature.properties;

	const count = props.bike_count;
	const zoneId = props.zone_id;

	if (!count || !zoneId) return '';

	let zoneColorScheme = '';

	if (zoneId === 1)
		zoneColorScheme = 'bg-blue-400 dark:bg-blue-600 border-blue-500 dark:border-blue-700';
	else if (zoneId === 2)
		zoneColorScheme =
			'bg-emerald-400 dark:bg-emerald-600 border-emerald-500 dark:border-emerald-700';
	else if (zoneId === 3)
		zoneColorScheme = 'bg-yellow-400 dark:bg-yellow-600 border-yellow-500 dark:border-yellow-700';

	const zoneName =
		zoneId === 1
			? 'Parkeringzon'
			: zoneId === 2
				? 'Laddstation'
				: zoneId === 3
					? 'Förbjuden zon'
					: 'Okänd zon';

	const [bikesPart, parkedPart] = count === 1 ? ['cykel', 'parkerad'] : ['cyklar', 'parkerade'];
	const bikeCountText = `Det är <span class="text-surface-700 dark:text-surface-50">${count} ${bikesPart}</span> ${parkedPart} i zonen`;

	const bikeCards = props?.bikes
		? props.bikes
				.map((bike) => {
					return `
					<a class="group flex items-center px-2 py-1 space-y-1 gap-2 odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800" href="/admin/bikes/${
						bike.id
					}" target="_blank">
						<div class="flex-grow">
							<div class="flex justify-between">
								<p class="text-xs ">#${bike.id}</p>
								<p class="text-xs text-gray-500 dark:text-surface-300">${bike.active ? 'Aktiv' : 'Avstängd'} (${
									statusCodes[bike.status_id]
								})</p>
							</div>
							${chargeMeterHTML(bike.charge_perc, 'h-2', false)}
						</div>
						<div class="my-auto group-hover:text-surface-700 group-hover:dark:text-white text-gray-500 dark:text-surface-300 text-xl">
							↗
						</div>	
					</a>`;
				})
				.join('')
		: '<p class="text-center">Inga cyklar i zonen</p>';

	return `
			<div class="rounded-full text-xs border text-surface-700 dark:text-surface-50 ${zoneColorScheme} text-center m-2 px-2 py-0.5 w-fit p-1">${zoneName}</div>
			<div class="px-2 pt-4 pb-4">
			<p class="text-gray-500 dark:text-surface-300 ml-2 mb-2">${bikeCountText}</p>
			<div class="min-w-56  overflow-auto max-h-72 scrollbar-hide">
				<div class=" divide-y divide-gray-100 dark:divide-surface-600"></div>
					${bikeCards}
				</div>
			</div>
			</div>
		`;
};
