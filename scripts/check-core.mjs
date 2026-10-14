// Run pure TypeScript business logic without downloading dependencies (Node 24).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();
function moduleURL(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  let code = stripTypeScriptTypes(fs.readFileSync(filename, 'utf8'));
  code = code.replace(/from ['"](\.[^'"]+)['"]/g, (_match, specifier) => {
    const child = path.resolve(path.dirname(filename), specifier + (specifier.endsWith('.ts') ? '' : '.ts'));
    return `from '${moduleURL(child)}'`;
  });
  const url = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
  cache.set(filename, url);
  return url;
}
const dates = await import(moduleURL('src/lib/date.ts'));
const storage = await import(moduleURL('src/lib/storage.ts'));
const { getDashboard } = await import(moduleURL('src/lib/dashboard.ts'));
const { generatePlan, plannedTaskIds, ensureDailyPlan, getPlanCompletion } = await import(moduleURL('src/lib/plan.ts'));
const records = await import(moduleURL('src/lib/records.ts'));
const statistics = await import(moduleURL('src/lib/statistics.ts'));
const { chartGeometry } = await import(moduleURL('src/lib/chart.ts'));
const { createId } = await import(moduleURL('src/lib/id.ts'));
assert.equal(new Set(Array.from({ length: 100 }, () => createId())).size, 100);
const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
try {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues: array => { array.fill(1); return array; } } });
  assert.equal(createId(), '01'.repeat(16)); // LAN HTTP: randomUUID absent
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined });
  assert.ok(createId().length > 10);
} finally {
  if (cryptoDescriptor) Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
  else delete globalThis.crypto;
}
assert.equal(dates.dateKey(new Date('2026-10-12T15:59:59Z')), '2026-10-12');
assert.equal(dates.dateKey(new Date('2026-10-12T16:00:00Z')), '2026-10-13');
assert.equal(dates.addDays('2026-10-13', 47), '2026-11-29');
assert.equal(dates.addDays('2026-12-31', 1), '2027-01-01');
assert.equal(dates.isDateKey('2026-02-30'), false);
assert.equal(dates.isDateKey('2028-02-29'), true);

const data = storage.createInitialData();
data.profile.startDate = '2026-10-13';
data.profile.examDate = '2026-11-29';
const empty = getDashboard(data, '2026-10-13');
assert.equal(empty.remainingDays, 47);
assert.equal(empty.completionRate, 0);
assert.equal(empty.plannedTasks, 6);
assert.equal(empty.weightKg, 89);
assert.equal(empty.weightDate, null);
assert.equal(empty.studyMinutes, 0);
assert.equal(empty.rehabCount, 0);
assert.equal(getDashboard(data, '2026-11-29').remainingDays, 0);
assert.equal(getDashboard(data, '2026-11-30').remainingDays, -1);
assert.equal(getDashboard(data, '2026-11-30').sprintProgress, 100);
assert.equal(getDashboard(data, '2026-10-12').sprintProgress, 0);
const day = date => ({ date, plannedTaskIds: ['a', 'b'], completedTaskIds: ['a', 'a', 'unknown'],
  completedRehabIds: ['mcgill', 'bird-dog', 'bird-dog', 'unknown'], painScore: null,
  weightKg: 88, steps: null, exercises: ['散步'],
  meals: { breakfast: '', lunch: '', dinner: '', proteinG: null }, supplements: [] });
data.days['2026-10-12'] = day('2026-10-12');
data.days['2026-10-13'] = { ...day('2026-10-13'), weightKg: null };
data.days['2026-10-14'] = { ...day('2026-10-14'), weightKg: 87 };
data.studyRecords = [
  { id: '1', date: '2026-10-13', category: '行测', minutes: 50, note: '' },
  { id: '2', date: '2026-10-13', category: '申论', minutes: 90, note: '' },
  { id: '3', date: '2026-10-12', category: '行测', minutes: 60, note: '' },
];
const summary = getDashboard(data, '2026-10-13');
assert.equal(summary.completionRate, 50);
assert.equal(summary.completedTasks, 1);
assert.equal(summary.studyMinutes, 140);
assert.equal(summary.weightKg, 88);
assert.equal(summary.weightDate, '2026-10-12');
assert.equal(summary.rehabCount, 2);
assert.deepEqual(summary.exercises, ['散步']);
delete data.days['2026-10-13'].plannedTaskIds;
assert.equal(getDashboard(data, '2026-10-13').completionRate, 0);

// Every weekday maps to the requested morning subject and evening training.
const subjects = ['资料分析错题', '判断推理', '言语理解', '数量关系', '错题复盘'];
const workouts = ['力量训练 A', '核心恢复', '力量训练 B', '核心恢复', '力量训练 C'];
for (let i = 0; i < 5; i++) {
  const plan = generatePlan(dates.addDays('2026-10-19', i), data.profile);
  assert.equal(plan.template, 'weekday');
  assert.equal(plan.studyMinutes, 190);
  assert.equal(plan.tasks.find(item => item.id === 'morning-study').title, subjects[i]);
  assert.equal(plan.tasks.find(item => item.id === 'workout').title, workouts[i]);
  assert.equal(plan.tasks.find(item => item.id === 'work-am').start, '08:30');
  assert.equal(plan.tasks.find(item => item.id === 'work-am').end, '11:30');
  assert.equal(plan.tasks.find(item => item.id === 'work-pm').start, '13:30');
  assert.equal(plan.tasks.find(item => item.id === 'work-pm').end, '17:00');
  assert.equal(plan.tasks.find(item => item.id === 'morning-rehab').end, '06:35');
  assert.equal(plan.tasks.find(item => item.id === 'sleep').start, '22:30');
  assert.equal(plannedTaskIds(plan).length, 6);
  assert.equal(plan.tasks.some(item => item.kind === 'travel'), i % 2 === 0);
  assert.equal(new Set(plan.tasks.map(item => item.id)).size, plan.tasks.length);
  for (let j = 1; j < plan.tasks.length; j++) {
    const previous = plan.tasks[j - 1];
    assert.ok((previous.end ?? previous.start) <= plan.tasks[j].start, 'Schedule should not overlap');
  }
}
for (const date of ['2026-10-24', '2026-10-25']) {
  const plan = generatePlan(date, data.profile);
  assert.equal(plan.template, 'weekend');
  assert.equal(plan.studyMinutes, 390);
  assert.equal(plan.tasks.some(item => item.kind === 'work'), false);
  assert.equal(plannedTaskIds(plan).length, 8);
}
assert.equal(generatePlan('2026-10-12', data.profile).template, 'outside');
assert.equal(generatePlan('2026-11-29', data.profile).template, 'exam');
assert.equal(generatePlan('2026-11-30', data.profile).tasks.length, 0);
assert.throws(() => generatePlan('2026-02-30', data.profile));
assert.equal(generatePlan('2026-11-28', data.profile).template, 'weekend');
assert.deepEqual(generatePlan('2026-10-19', data.profile), generatePlan('2026-10-19', data.profile));
const source = structuredClone(data);
source.days['2026-10-13'].completedTaskIds = ['wake'];
const snapshot = ensureDailyPlan(source, '2026-10-13');
assert.notEqual(snapshot, source);
assert.equal(source.days['2026-10-13'].plannedTaskIds, undefined);
assert.deepEqual(snapshot.days['2026-10-13'].completedTaskIds, ['wake']);
assert.equal(snapshot.days['2026-10-12'].weightKg, 88);
assert.equal(snapshot.days['2026-10-13'].plannedTaskIds.length, 6);
assert.equal(ensureDailyPlan(snapshot, '2026-10-13'), snapshot);
assert.equal(ensureDailyPlan(snapshot, '2026-11-29'), snapshot);
const newDay = ensureDailyPlan(snapshot, '2026-10-15');
assert.equal(newDay.days['2026-10-15'].weightKg, null);
assert.deepEqual(newDay.days['2026-10-15'].completedTaskIds, []);
const complete = getPlanCompletion(generatePlan('2026-10-13', source.profile), snapshot.days['2026-10-13']);
assert.equal(complete.completed, 1);
assert.equal(complete.total, 6);
assert.equal(getDashboard(snapshot, '2026-10-13').completionRate, complete.percent);
assert.equal(getDashboard(snapshot, '2026-11-29').completionRate, null);
assert.equal(getPlanCompletion(generatePlan('2026-11-29', source.profile)).percent, null);

const today = '2026-10-13';
let checked = records.toggleTask(snapshot, today, 'morning-study', today);
assert.ok(checked.days[today].completedTaskIds.includes('morning-study'));
assert.equal(getDashboard(checked, today).completedTasks, 2);
checked = records.toggleTask(checked, today, 'morning-study', today);
assert.equal(getDashboard(checked, today).completedTasks, 1);
assert.throws(() => records.toggleTask(checked, today, 'work-am', today));
assert.throws(() => records.toggleTask(checked, '2026-10-14', 'wake', today));
assert.deepEqual(records.toggled(['a', 'a', 'b'], 'a'), ['b']);
checked = records.patchDay(checked, today, { weightKg: 86.5, painScore: 0, steps: 5000 }, today);
assert.equal(checked.days[today].painScore, 0);
assert.ok(checked.days[today].completedTaskIds.includes('wake'));
assert.equal(snapshot.days[today].weightKg, null);
checked = records.patchDay(checked, today, { meals: { breakfast: '鸡蛋', lunch: '鸡肉', dinner: '鱼', proteinG: 65 }, completedRehabIds: ['mcgill', 'bird-dog', 'glute-bridge', 'dead-bug', 'side-plank'], exercises: ['散步'], supplements: ['fish-oil'] }, today);
assert.equal(records.healthSummary(checked, today).progress, 50);
assert.equal(records.healthSummary(checked, today).proteinPercent, 50);
assert.equal(records.healthSummary(checked, today).rehabCount, 5);
assert.equal(records.healthSummary(checked, today).bmi.toFixed(1), '27.9');
assert.equal(getDashboard(checked, today).rehabCount, 5);
assert.equal(checked.days[today].weightKg, 86.5);
assert.throws(() => records.patchDay(checked, today, { painScore: 11 }, today));
assert.throws(() => records.patchDay(checked, today, { steps: 1.5 }, today));
assert.throws(() => records.patchDay(checked, today, { weightKg: NaN }, today));
assert.throws(() => records.patchDay(checked, today, { supplements: ['CoQ10'] }, today));
const cleared = records.patchDay(checked, today, { weightKg: null, painScore: null }, today);
assert.equal(cleared.days[today].weightKg, null);
assert.equal(cleared.days[today].painScore, null);
assert.equal(records.optionalNumber('', '评分', 0, 10), null);
assert.equal(records.optionalNumber('0', '评分', 0, 10), 0);
assert.throws(() => records.optionalNumber('abc', '评分', 0, 10));
const study = { id: 'new-study', date: today, category: '行测', minutes: 30, note: '' };
const learned = records.addStudyRecord(checked, study, today);
assert.equal(records.addStudyRecord(learned, study, today), learned);
assert.equal(getDashboard(learned, today).studyMinutes, 170);
assert.equal(records.studyTotals(learned, today).daily, 170);
assert.equal(records.studyTotals(learned, today).weekly, 230);
assert.equal(records.studyTotals(learned, '2026-10-18').weekly, 230);
assert.equal(records.studyTotals(learned, '2026-10-19').weekly, 0);
assert.throws(() => records.addStudyRecord(learned, { ...study, id: 'bad', minutes: -1 }, today));
assert.throws(() => records.addStudyRecord(learned, { ...study, id: 'bad', date: '2026-10-14' }, today));
assert.throws(() => records.addStudyRecord(learned, { ...study, id: 'bad', minutes: 1400 }, today));
const session = { id: 'timer', date: today, category: '申论', elapsedMs: 30000, startedAt: 1000 };
assert.equal(records.timerElapsed(session, 61000), 90000);
assert.equal(records.timerElapsed({ ...session, startedAt: null }, 61000), 30000);
assert.equal(records.timerElapsed(session, 0), 30000);

assert.deepEqual(statistics.periodBounds('2026-10-18', 'week'), { start: '2026-10-12', end: '2026-10-18' });
assert.deepEqual(statistics.periodBounds('2026-10-19', 'week'), { start: '2026-10-19', end: '2026-10-25' });
assert.deepEqual(statistics.periodBounds('2026-12-31', 'week'), { start: '2026-12-28', end: '2027-01-03' });
assert.deepEqual(statistics.periodBounds('2028-02-10', 'month'), { start: '2028-02-01', end: '2028-02-29' });
assert.deepEqual(statistics.periodBounds('2026-02-10', 'month'), { start: '2026-02-01', end: '2026-02-28' });
assert.deepEqual(statistics.periodBounds('2026-12-10', 'month'), { start: '2026-12-01', end: '2026-12-31' });
const reportData = storage.createInitialData();
reportData.profile.startDate = '2026-10-16';
reportData.profile.examDate = '2026-11-29';
reportData.days['2026-10-16'] = { ...day('2026-10-16'), weightKg: 89, painScore: 4, completedTaskIds: ['wake', 'wake', 'work-am'], plannedTaskIds: undefined, exercises: ['散步', '散步', '核心训练'] };
reportData.days['2026-10-17'] = { ...day('2026-10-17'), weightKg: 87, painScore: 0, completedTaskIds: ['wake'], plannedTaskIds: undefined, exercises: ['游泳'] };
reportData.days['2026-10-18'] = { ...day('2026-10-18'), weightKg: 60, painScore: 10 };
reportData.studyRecords = [{ id: 'report-1', date: '2026-10-16', category: '行测', minutes: 60, note: '' }, { id: 'report-2', date: '2026-10-18', category: '行测', minutes: 100, note: '' }];
const report = statistics.getReport(reportData, '2026-10-17', 'week', '2026-10-17');
assert.equal(report.studyHours, 1);
assert.equal(report.exerciseCount, 3);
assert.equal(report.exerciseDays, 2);
assert.equal(report.averageWeight, 88);
assert.equal(report.weightSamples, 2);
assert.equal(report.painChange, -4);
assert.equal(report.painSamples, 2);
assert.equal(report.completedTasks, 2);
assert.equal(report.plannedTasks, 14);
assert.equal(report.completionRate, 14); // weighted across weekday 6 + weekend 8 tasks
assert.equal(report.days.find(item => item.date === '2026-10-18').studyHours, null);
assert.equal(report.days.find(item => item.date === '2026-10-18').weightKg, null);
assert.equal(report.days.find(item => item.date === '2026-10-15').completionRate, null);
assert.equal(report.days.find(item => item.date === '2026-10-15').weightKg, null);
assert.equal(report.days.find(item => item.date === '2026-10-17').painScore, 0);
const noReport = statistics.getReport(storage.createInitialData(), '2026-01-10', 'month', '2026-10-13');
assert.equal(noReport.averageWeight, null);
assert.equal(noReport.painChange, null);
assert.equal(noReport.studyHours, 0);
assert.equal(noReport.completionRate, null);
assert.equal(noReport.days.length, 31);
const graph = chartGeometry([{ date: 'a', value: 4 }, { date: 'b', value: null }, { date: 'c', value: 0 }], [0, 10]);
assert.equal(graph.paths.length, 2);
assert.equal(graph.coordinates[1].y, null);
assert.equal(graph.coordinates[2].y, 148);
assert.equal(chartGeometry([{ date: 'a', value: null }]).hasData, false);
assert.equal(chartGeometry([{ date: 'a', value: 0 }]).hasData, true);
assert.ok(chartGeometry([{ date: 'a', value: 89 }]).coordinates.every(point => Number.isFinite(point.y)));

let saved = null;
globalThis.localStorage = { getItem: () => saved, setItem: (_key, value) => { saved = value; } };
assert.equal(storage.loadData().error, null);
assert.equal(storage.saveData(data), null);
assert.deepEqual(storage.loadData().data, data);
assert.equal(storage.saveData(learned), null);
assert.deepEqual(storage.loadData().data, learned);
const firstRaw = storage.loadData().raw;
const changedByOtherWindow = { ...learned, profile: { ...learned.profile, targetWeightKg: 83 } };
const concurrentRaw = JSON.stringify(changedByOtherWindow);
saved = concurrentRaw;
assert.ok(storage.saveDataIfUnchanged(data, firstRaw).error);
assert.equal(saved, concurrentRaw); // do not overwrite newer browser data
const currentRaw = storage.loadData().raw;
const savedSafely = storage.saveDataIfUnchanged(changedByOtherWindow, currentRaw);
assert.equal(savedSafely.error, null);
assert.equal(savedSafely.raw, saved);
saved = null; // another window clears storage
assert.ok(storage.saveDataIfUnchanged(data, savedSafely.raw).error);
assert.equal(saved, null);
assert.equal(storage.saveDataIfUnchanged(data, null).error, null);
saved = '{broken';
assert.ok(storage.loadData().error);
assert.equal(saved, '{broken');
const invalid = structuredClone(data);
invalid.days['2026-10-13'].exercises = 'invalid';
saved = JSON.stringify(invalid);
assert.ok(storage.loadData().error);
invalid.days = {};
invalid.profile.examDate = '2026-02-30';
saved = JSON.stringify(invalid);
assert.ok(storage.loadData().error);
localStorage.setItem = () => { throw new Error('Quota'); };
assert.ok(storage.saveData(data));
assert.ok(storage.saveDataIfUnchanged(data, saved).error);
console.log('PASS: all business logic and chart checks, plus stale-window write rejection, concurrent deletion preservation, first-write initialization and guarded storage failure.');
