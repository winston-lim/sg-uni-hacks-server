import { Hack } from "../entities/Hack";

export const compareHackData = (hack1: Hack, hack2: Hack) => {
	const { title, category, description, body, createdAt, updatedAt } = hack1;
	const {
		title: title2,
		category: category2,
		description: description2,
		body: body2,
		createdAt: createdAt2,
		updatedAt: updatedAt2,
	} = hack2;
	const hackData1 = {
		title,
		category,
		description,
		body,
		createdAt,
		updatedAt,
	};
	const hackData2 = {
		title: title2,
		category: category2,
		description: description2,
		body: body2,
		createdAt: createdAt2,
		updatedAt: updatedAt2,
	};
	const hackDifferences = [];
	for (const key in hackData1) {
		if (hackData1[key] !== hackData2[key]) {
			hackDifferences.push(key);
		}
	}
	if (hackDifferences.length > 0) {
		return hackDifferences;
	}
	return null;
};
