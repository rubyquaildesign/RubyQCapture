function assertString(input: any) {
	const isString = typeof input === 'string' || input instanceof String;

	if (!isString) {
		let invalidType = typeof input;
		if (input === null) invalidType = 'null';
		else if (invalidType === 'object') invalidType = input.constructor.name;

		throw new TypeError(`Expected a string but received a ${invalidType}`);
	}
}
const validMediaType = /^[a-z]+\/[a-z0-9\-\+\._]+$/i;

const validAttribute = /^[a-z\-]+=[a-z0-9\-]+$/i;

const validData = /^[a-z0-9!\$&'\(\)\*\+,;=\-\._~:@\/\?%\s]*$/i;

export default function isDataURI(str: string) {
	assertString(str);
	const data = str.split(',');
	if (data.length < 2) {
		return false;
	}
	const attributes = data.shift()!.trim().split(';');
	const schemeAndMediaType = attributes.shift()!;
	if (schemeAndMediaType.slice(0, 5) !== 'data:') {
		return false;
	}
	const mediaType = schemeAndMediaType.slice(5);
	if (mediaType !== '' && !validMediaType.test(mediaType)) {
		return false;
	}
	for (let i = 0; i < attributes.length; i++) {
		if (
			!(
				i === attributes.length - 1 && attributes[i].toLowerCase() === 'base64'
			) &&
			!validAttribute.test(attributes[i])
		) {
			return false;
		}
	}
	for (let i = 0; i < data.length; i++) {
		if (!validData.test(data[i])) {
			return false;
		}
	}
	return true;
}
