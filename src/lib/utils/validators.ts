export const isNDigits = (value: string, digits: number) =>
	new RegExp(`^\\d{${digits}}$`).test(value);
