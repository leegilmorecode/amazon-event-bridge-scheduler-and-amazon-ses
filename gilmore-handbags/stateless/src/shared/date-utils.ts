export const getISOString = () => {
  return new Date().toISOString();
};

export function formatISODatetimeForScheduler(isoString: string): string {
  const date = new Date(isoString);

  const pad = (num: number): string => num.toString().padStart(2, '0');

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth());
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
