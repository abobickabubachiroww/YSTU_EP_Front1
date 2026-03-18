import * as XLSX from 'xlsx';

const WEEK_COUNT = 52;

function generateWeekDateRanges(startDateStr: string): string[] {
  const weekRanges: string[] = [];
  
  // Парсим дату правильно (игнорируя timezone issues)
  const [year, month, day] = startDateStr.split('-').map(Number);
  const firstDay = new Date(year, month - 1, day); // месяцы считаются с 0
  const dayOfWeek = firstDay.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
  
  const formatDate = (date: Date): string => {
    const d = date.getDate();
    const m = date.toLocaleDateString('ru-RU', { month: 'short' });
    return `${d} ${m}`;
  };

  const DAY_MS = 24 * 60 * 60 * 1000;
  
  // Если 1 число - суббота (6) или воскресенье (0), начинаем с понедельника
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Пропускаем выходной день, начинаем с понедельника
    const daysToMonday = dayOfWeek === 0 ? 1 : 2;
    const firstMonday = new Date(firstDay.getTime() + daysToMonday * DAY_MS);
    
    // Все 52 недели - полные недели пн-вс
    for (let i = 0; i < WEEK_COUNT; i++) {
      const weekStart = new Date(firstMonday.getTime() + i * 7 * DAY_MS);
      const weekEnd = new Date(firstMonday.getTime() + (i * 7 + 6) * DAY_MS);
      weekRanges.push(`${formatDate(weekStart)}-${formatDate(weekEnd)}`);
    }
  } else {
    // Будний день - начинаем с этого дня
    // Первая неделя: от startDate до ближайшего воскресенья
    const daysToNextSunday = 8 - dayOfWeek; // это количество дней включая воскресенье
    const firstWeekEnd = new Date(firstDay.getTime() + (daysToNextSunday - 1) * DAY_MS);
    
    weekRanges.push(`${formatDate(firstDay)}-${formatDate(firstWeekEnd)}`);
    
    // Остальные 51 неделя - полные недели пн-вс
    const firstMonday = new Date(firstDay.getTime() + daysToNextSunday * DAY_MS);
    
    for (let i = 0; i < WEEK_COUNT - 1; i++) {
      const weekStart = new Date(firstMonday.getTime() + i * 7 * DAY_MS);
      const weekEnd = new Date(firstMonday.getTime() + (i * 7 + 6) * DAY_MS);
      weekRanges.push(`${formatDate(weekStart)}-${formatDate(weekEnd)}`);
    }
  }

  return weekRanges;
}

export function exportCalendarPlan(plan: any) {
  const data = plan.data;
  if (!data || !Array.isArray(data.courses)) {
    alert('Нет данных для экспорта');
    return;
  }

  // Генерируем даты для недель
  const startDate = data.start_date || `${data.academic_year}-09-01`;
  const weekDateRanges = generateWeekDateRanges(startDate);

  const rows: any[][] = [];

  /** ---------- Заголовок документа ---------- */
  rows.push(['КАЛЕНДАРНЫЙ УЧЕБНЫЙ ГРАФИК']);
  rows.push([`Название: ${data.title}`]);
  rows.push([`Учебный год: ${data.academic_year}`]);
  rows.push([`Группа: ${data.group}`]);
  rows.push([`Профиль: ${data.profile}`]);
  rows.push([`Регистрационный номер: ${data.reg_number}`]);
  rows.push([]);

  /** ---------- Заголовки таблицы ---------- */
  rows.push([
    'Курс',
    ...weekDateRanges,
    'О',
    'В',
    'Итого',
    'Экз',
    'Уч. практ.',
    'Другие практ.',
    'Преддипл.',
    'НИР',
    'ГИА',
    'Каникулы',
    'Всего',
  ]);

  /** ---------- Итоги ---------- */
  const totals = {
    theoryAutumn: 0,
    theorySpring: 0,
    theoryTotal: 0,
    exams: 0,
    study: 0,
    other: 0,
    pre: 0,
    nir: 0,
    gia: 0,
    holidays: 0,
    total: 0,
  };

  /** ---------- Строки курсов ---------- */
  data.courses.forEach((course: any) => {
    const weeks = course.weeks ?? Array(WEEK_COUNT).fill('');

    const autumnWeeks = weeks.slice(0, 23);
    const springWeeks = weeks.slice(23);

    const isTheory = (w: string) => w === '' || w === 'С';
    const count = (v: string) => weeks.filter((w: string) => w === v).length;

    const theoryAutumn = autumnWeeks.filter(isTheory).length;
    const theorySpring = springWeeks.filter(isTheory).length;
    const theoryTotal = theoryAutumn + theorySpring;

    const exams = count('С');
    const study = count('У');
    const other = count('П');
    const pre = count('Д');
    const nir = count('Н');
    const gia = count('Г');
    const holidays = count('=');

    const total =
      theoryTotal + study + other + pre + nir + gia + holidays;

    // строка курса
    rows.push([
      course.course,
      ...weeks,
      theoryAutumn,
      theorySpring,
      theoryTotal,
      exams,
      study,
      other,
      pre,
      nir,
      gia,
      holidays,
      total,
    ]);

    // накопление итогов
    totals.theoryAutumn += theoryAutumn;
    totals.theorySpring += theorySpring;
    totals.theoryTotal += theoryTotal;
    totals.exams += exams;
    totals.study += study;
    totals.other += other;
    totals.pre += pre;
    totals.nir += nir;
    totals.gia += gia;
    totals.holidays += holidays;
    totals.total += total;
  });

  /** ---------- Итоговая строка ---------- */
  rows.push([
    'Итого',
    ...Array(WEEK_COUNT).fill(''),
    totals.theoryAutumn,
    totals.theorySpring,
    totals.theoryTotal,
    totals.exams,
    totals.study,
    totals.other,
    totals.pre,
    totals.nir,
    totals.gia,
    totals.holidays,
    totals.total,
  ]);

  /** ---------- Пустая строка ---------- */
  rows.push([]);

  /** ---------- Легенда ---------- */
  rows.push(['Условные обозначения:']);
  rows.push(['С — экзаменационная сессия']);
  rows.push(['У — учебная практика']);
  rows.push(['П — производственная практика']);
  rows.push(['Д — преддипломная практика']);
  rows.push(['Г — государственная итоговая аттестация']);
  rows.push(['= — каникулы']);
  rows.push(['Н — НИР']);
  rows.push(['(пусто) — теоретическое обучение']);

  /** ---------- Excel ---------- */
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Календарный график');
  XLSX.writeFile(workbook, `${'Календарный_учебный_график_' + data.group + '_' + data.academic_year || 'calendar_plan'}.xlsx`);
}
