/**
 * Utility helper to format timestamps into Indian format (DD/MM/YYYY, hh:mm:ss AM/PM)
 */
export const formatIndianTimestamp = (rawTimestamp?: string | Date | null): string => {
  if (!rawTimestamp) return '—';

  const str = String(rawTimestamp).trim();
  if (!str) return '—';

  // Check if string matches YYYY-MM-DD HH:mm:ss or YYYY-MM-DDTHH:mm:ss
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2}))?/);

  if (match) {
    const [, yyyy, mm, dd, hhStr, minStr, secStr] = match;
    const dateStr = `${dd}/${mm}/${yyyy}`;
    if (hhStr !== undefined && minStr !== undefined && secStr !== undefined) {
      let hours = parseInt(hhStr, 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, '0');
      return `${dateStr}, ${formattedHours}:${minStr}:${secStr} ${ampm}`;
    }
    return dateStr;
  }

  // Fallback to JS Date object parsing
  const d = new Date(rawTimestamp);
  if (isNaN(d.getTime())) return str;

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');

  return `${dd}/${mm}/${yyyy}, ${strHours}:${minutes}:${seconds} ${ampm}`;
};
