export function groupDatesByMonthWeek(dates: Date[]): { week: number; count: number }[] {
  const counts = [0, 0, 0, 0];
  dates.forEach((date) => {
    const index = Math.min(3, Math.floor((date.getDate() - 1) / 7));
    counts[index]++;
  });
  return counts.map((count, index) => ({ week: index + 1, count }));
}
