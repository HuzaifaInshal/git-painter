export type IntensityLevel = 'minimal' | 'light' | 'moderate' | 'heavy' | 'extreme';
export type DistributionCurve = 'flat' | 'ramp-up' | 'ramp-down' | 'bell' | 'random-spikes' | 'custom';
export type TimeOfDayProfile = 'office-hours' | 'night-owl' | 'random' | 'custom';
export type WeekendBehavior = 'skip' | 'reduced' | 'same' | 'only-weekends';
export type CommitMessageStyle = 'random-lorem' | 'conventional' | 'custom-list' | 'simple-counter';

export interface IntensityConfig {
  level: IntensityLevel;
  minPerDay: number;
  maxPerDay: number;
  distributionCurve: DistributionCurve;
  customCurvePoints?: number[];
  activeDayPercentage: number;
}

export interface TimeConfig {
  profile: TimeOfDayProfile;
  customStartHour?: number;
  customEndHour?: number;
  clusterInMorning?: boolean;
  clusterInEvening?: boolean;
}

export interface CommitStyleConfig {
  messageStyle: CommitMessageStyle;
  customMessages?: string[];
  conventionalTypes?: string[];
  prefix?: string;
  authorName: string;
  authorEmail: string;
  branchName: string;
}

export interface AdvancedConfig {
  seed?: string;
  fileChangeMode: 'single-file' | 'multi-file' | 'empty-commits';
  simulatedFileCount?: number;
  commitSizeVariance: boolean;
  includeReadme: boolean;
  readmeContent?: string;
  gpgSign: false;
}

export interface ConfigRange {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
  isFixed?: boolean;
  
  // Calendar rules moved to range
  skipWeekdays: number[];
  weekendBehavior: WeekendBehavior;
  
  intensity: IntensityConfig;
  time: TimeConfig;
  style: CommitStyleConfig;
  advanced: AdvancedConfig;
}

export interface GeneratorConfig {
  repoName: string;
  skipDates: string[]; // Still global as they are specific absolute dates
  ranges: ConfigRange[];
}

export interface CommitPlan {
  date: string;
  datetime: Date;
  message: string;
  filesChanged: FileChange[];
}

export interface FileChange {
  path: string;
  content: string;
}

export interface ParsedCommit {
  hash: string;
  message: string;
  authorDate: string;
  authorName: string;
  authorEmail: string;
}
