export const getTimePeriodLabel = (hour: number) => {
  if (hour >= 0 && hour < 6) return 'madrugada';
  if (hour < 12) return 'mañana';
  if (hour < 18) return 'tarde';
  return 'noche';
};

export const formatTimeWithPeriod = (value?: string) => {
  if (!value || typeof value !== 'string') return '-';

  const normalized = value.trim();
  const [hourPart, minutePart] = normalized.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return value;
  }

  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = String(minute).padStart(2, '0');
  const suffix = hour >= 12 ? 'p. m.' : 'a. m.';
  const label = getTimePeriodLabel(hour);

  return `${displayHour}:${displayMinute} ${suffix} (${label})`;
};
