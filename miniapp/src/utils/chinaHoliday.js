const holidayMap = new Map();

const toKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addRange = (start, end, status) => {
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    holidayMap.set(toKey(cursor), { status });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
};

// 2026 official public-holiday and adjusted-workday arrangement.
[
  ['2026-01-01', '2026-01-03'],
  ['2026-02-15', '2026-02-23'],
  ['2026-04-04', '2026-04-06'],
  ['2026-05-01', '2026-05-05'],
  ['2026-06-19', '2026-06-21'],
  ['2026-09-25', '2026-09-27'],
  ['2026-10-01', '2026-10-07'],
].forEach(([start, end]) => addRange(start, end, 'rest'));

['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10']
  .forEach((key) => holidayMap.set(key, { status: 'work' }));

const festivalNames = {
  '2026-01-01': '元旦',
  '2026-02-16': '除夕',
  '2026-02-17': '春节',
  '2026-03-03': '元宵',
  '2026-04-05': '清明',
  '2026-05-01': '劳动',
  '2026-06-19': '端午',
  '2026-09-25': '中秋',
  '2026-10-01': '国庆',
};

Object.entries(festivalNames).forEach(([key, name]) => {
  holidayMap.set(key, { ...holidayMap.get(key), name });
});

const fixedFestivalNames = {
  '01-01': '元旦',
  '05-01': '劳动',
  '10-01': '国庆',
};

export const getChinaHoliday = (dateKey) => {
  const configured = holidayMap.get(dateKey);
  if (configured) return configured;
  const name = fixedFestivalNames[String(dateKey).slice(5)];
  if (name) return { name };
  const date = new Date(`${dateKey}T00:00:00Z`);
  return date.getUTCDay() === 0 || date.getUTCDay() === 6 ? { status: 'rest' } : null;
};
