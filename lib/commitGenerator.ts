import seedrandom from 'seedrandom';
import { format, eachDayOfInterval, parseISO, getDay } from 'date-fns';
import {
  GeneratorConfig, CommitPlan, FileChange,
  IntensityConfig, TimeConfig, CommitStyleConfig, AdvancedConfig,
  ConfigRange
} from './types';

const LOREM_MESSAGES = [
  'refactor authentication module',
  'update dependencies',
  'fix null pointer in user service',
  'add unit tests for payment handler',
  'improve error handling in API layer',
  'optimize database query performance',
  'update README documentation',
  'fix broken CI pipeline',
  'add input validation to forms',
  'resolve merge conflicts',
  'cleanup unused imports',
  'implement retry logic for network requests',
  'fix CSS layout issues on mobile',
  'add logging to critical paths',
  'update environment configuration',
  'refactor data models for clarity',
  'fix race condition in async handler',
  'add pagination to list endpoints',
  'update API response format',
  'fix memory leak in event listeners',
  'implement caching layer',
  'update test fixtures',
  'add type annotations',
  'fix timezone handling',
  'improve loading state UX',
  'add error boundary components',
  'fix edge case in sorting algorithm',
  'update third-party integrations',
  'refactor routing logic',
  'add health check endpoint',
  'fix incorrect status codes',
  'improve code splitting',
  'update security headers',
  'add rate limiting',
  'fix session management bug',
  'refactor service layer',
  'add feature flag support',
  'fix date parsing edge case',
  'improve performance monitoring',
  'update localization strings',
  'fix image optimization pipeline',
  'add webhook support',
  'refactor notification system',
  'fix config loading on startup',
  'add audit logging',
  'update email templates',
  'fix broken link in navigation',
  'improve search functionality',
  'add dark mode support',
  'fix modal accessibility issues',
];

const CONVENTIONAL_SCOPES = [
  'auth', 'api', 'ui', 'db', 'utils', 'config', 'tests', 'docs',
  'core', 'parser', 'router', 'store', 'cache', 'logger', 'worker',
];

const CONVENTIONAL_DESCRIPTIONS = [
  'improve error handling', 'add missing validation', 'fix edge case',
  'refactor for clarity', 'update dependencies', 'add unit tests',
  'optimize performance', 'fix type errors', 'improve documentation',
  'handle null values', 'add retry logic', 'clean up unused code',
  'fix broken tests', 'improve accessibility', 'update configuration',
];

const MULTI_FILES = [
  'src/index.js', 'src/utils.js', 'src/config.js', 'src/helpers.js',
  'src/api.js', 'src/models.js', 'docs/changelog.md',
];

export function generateCommitPlan(config: GeneratorConfig): CommitPlan[] {
  const seed = (config.ranges[0]?.advanced?.seed) || String(Date.now());
  const rng = seedrandom(seed);

  const skipDatesSet = new Set(config.skipDates);

  const filterDatesInRange = (dates: Date[], range: ConfigRange) => {
    const skipWeekdaySet = new Set(range.skipWeekdays);
    return dates.filter((d) => {
      const dateStr = format(d, 'yyyy-MM-dd');
      if (skipDatesSet.has(dateStr)) return false;
      const dow = getDay(d);
      if (skipWeekdaySet.has(dow)) return false;

      const isWeekend = dow === 0 || dow === 6;
      if (isWeekend) {
        if (range.weekendBehavior === 'skip') return false;
        if (range.weekendBehavior === 'only-weekends') return true;
      } else {
        if (range.weekendBehavior === 'only-weekends') return false;
      }
      return true;
    });
  };

  const plan: CommitPlan[] = [];
  const assignedDates = new Set<string>();
  let commitIndex = 0;

  const buckets: { 
    range: ConfigRange;
    dates: Date[];
  }[] = [];

  const activeRanges = (config.ranges || []).filter(r => r.enabled);
  
  for (let i = activeRanges.length - 1; i >= 0; i--) {
    const range = activeRanges[i];
    const rangeStart = parseISO(range.startDate);
    const rangeEnd = parseISO(range.endDate);
    
    const rangeDates = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
      .filter(d => {
        const ds = format(d, 'yyyy-MM-dd');
        return !assignedDates.has(ds);
      });
    
    if (rangeDates.length > 0) {
      buckets.push({
        range,
        dates: filterDatesInRange(rangeDates, range),
      });
      rangeDates.forEach(d => assignedDates.add(format(d, 'yyyy-MM-dd')));
    }
  }

  let totalCommits = 0;
  const rngCount = seedrandom(seed + '-count');
  const bucketCommits: { bucketIdx: number, activeDates: Date[], counts: number[] }[] = [];

  for (let b = 0; b < buckets.length; b++) {
    const bucket = buckets[b];
    const targetActive = Math.round(bucket.dates.length * (bucket.range.intensity.activeDayPercentage / 100));
    const shuffled = [...bucket.dates].sort(() => rngCount() - 0.5);
    const activeDates = shuffled.slice(0, targetActive).sort((a, b) => a.getTime() - b.getTime());
    
    const counts: number[] = [];
    for (let i = 0; i < activeDates.length; i++) {
      const c = getCommitCountForDay(i, activeDates.length, bucket.range.intensity, rngCount);
      counts.push(c);
      totalCommits += c;
    }
    bucketCommits.push({ bucketIdx: b, activeDates, counts });
  }

  const rngCommits = seedrandom(seed + '-commits');

  for (const bc of bucketCommits) {
    const bucket = buckets[bc.bucketIdx];
    for (let i = 0; i < bc.activeDates.length; i++) {
      const d = bc.activeDates[i];
      const count = bc.counts[i];
      for (let c = 0; c < count; c++) {
        const datetime = getRandomTime(format(d, 'yyyy-MM-dd'), bucket.range.time, rngCommits);
        const message = generateCommitMessage(commitIndex, totalCommits, bucket.range.style, rngCommits);
        const filesChanged = generateFileChanges(commitIndex, bucket.range.advanced, rngCommits);
        plan.push({ date: format(d, 'yyyy-MM-dd'), datetime, message, filesChanged });
        commitIndex++;
      }
    }
  }

  return plan.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
}

export function getCommitCountForDay(
  dayIndex: number,
  totalDays: number,
  config: IntensityConfig,
  rng: seedrandom.PRNG
): number {
  const { minPerDay, maxPerDay, distributionCurve } = config;
  const range = maxPerDay - minPerDay;
  let weight = 0.5;

  const progress = totalDays > 1 ? dayIndex / (totalDays - 1) : 0.5;

  switch (distributionCurve) {
    case 'flat':
      weight = rng();
      break;
    case 'ramp-up':
      weight = progress * rng();
      break;
    case 'ramp-down':
      weight = (1 - progress) * rng();
      break;
    case 'bell':
      weight = Math.exp(-Math.pow((progress - 0.5) * 4, 2)) * rng();
      break;
    case 'random-spikes':
      weight = rng() < 0.15 ? rng() * 0.7 + 0.3 : rng() * 0.3;
      break;
    case 'custom':
      if (config.customCurvePoints && config.customCurvePoints.length > 0) {
        const idx = Math.min(Math.floor(progress * config.customCurvePoints.length), config.customCurvePoints.length - 1);
        weight = (config.customCurvePoints[idx] / 100) * rng();
      } else {
        weight = rng();
      }
      break;
  }

  return Math.max(minPerDay, Math.min(maxPerDay, Math.round(minPerDay + weight * range)));
}

export function getRandomTime(date: string, profile: TimeConfig, rng: seedrandom.PRNG): Date {
  const base = parseISO(date);
  let hour: number;
  const minute = Math.floor(rng() * 60);
  const second = Math.floor(rng() * 60);

  switch (profile.profile) {
    case 'office-hours': {
      const slots = [9, 10, 10, 11, 11, 12, 14, 14, 15, 15, 16, 17];
      hour = slots[Math.floor(rng() * slots.length)];
      break;
    }
    case 'night-owl': {
      const nightHours = [20, 21, 22, 23, 0, 1];
      hour = nightHours[Math.floor(rng() * nightHours.length)];
      break;
    }
    case 'random':
      hour = Math.floor(rng() * 24);
      break;
    case 'custom': {
      const start = profile.customStartHour ?? 9;
      const end = profile.customEndHour ?? 18;
      const span = end > start ? end - start : 24 - start + end;
      hour = (start + Math.floor(rng() * span)) % 24;
      break;
    }
    default:
      hour = Math.floor(rng() * 24);
  }

  const result = new Date(base);
  result.setHours(hour, minute, second, 0);
  return result;
}

export function generateCommitMessage(
  index: number,
  total: number,
  config: CommitStyleConfig,
  rng: seedrandom.PRNG
): string {
  let msg = '';

  switch (config.messageStyle) {
    case 'random-lorem':
      msg = LOREM_MESSAGES[Math.floor(rng() * LOREM_MESSAGES.length)];
      break;
    case 'conventional': {
      const types = config.conventionalTypes?.length ? config.conventionalTypes : ['feat', 'fix', 'chore'];
      const type = types[Math.floor(rng() * types.length)];
      const scope = rng() > 0.4 ? CONVENTIONAL_SCOPES[Math.floor(rng() * CONVENTIONAL_SCOPES.length)] : '';
      const desc = CONVENTIONAL_DESCRIPTIONS[Math.floor(rng() * CONVENTIONAL_DESCRIPTIONS.length)];
      msg = scope ? `${type}(${scope}): ${desc}` : `${type}: ${desc}`;
      break;
    }
    case 'custom-list':
      if (config.customMessages?.length) {
        msg = config.customMessages[index % config.customMessages.length];
      } else {
        msg = `commit ${index + 1}`;
      }
      break;
    case 'simple-counter':
      msg = `commit ${index + 1} of ${total}`;
      break;
    default:
      msg = `update ${index + 1}`;
  }

  return config.prefix ? `${config.prefix} ${msg}` : msg;
}

export function generateFileChanges(
  commitIndex: number,
  config: AdvancedConfig,
  rng: seedrandom.PRNG
): FileChange[] {
  if (config.fileChangeMode === 'empty-commits') return [];

  const now = new Date().toISOString();
  const randomId = Math.floor(rng() * 100000);
  const actions = ['completed', 'started', 'updated', 'reviewed', 'merged', 'deployed'];
  const action = actions[Math.floor(rng() * actions.length)];

  if (config.fileChangeMode === 'single-file') {
    const lines = config.commitSizeVariance ? Math.floor(rng() * 5) + 1 : 1;
    const content = Array.from({ length: lines }, (_, i) =>
      `[${now}] task-${randomId + i}: ${action} (commit #${commitIndex})`
    ).join('\n') + '\n';
    return [{ path: 'activity-log.txt', content }];
  }

  const fileCount = Math.min(config.simulatedFileCount ?? 3, MULTI_FILES.length);
  const fileIdx = commitIndex % fileCount;
  const filePath = MULTI_FILES[fileIdx];
  const content = `// updated at ${now} — build ${randomId}\n`;
  return [{ path: filePath, content }];
}
