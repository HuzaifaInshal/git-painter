import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GeneratorConfig, CommitPlan, ParsedCommit, ConfigRange } from '@/lib/types';
import { format, subMonths } from 'date-fns';

const today = new Date();
const threeMonthsAgo = subMonths(today, 3);

const createDefaultRange = (startDate: string, endDate: string, name = 'Main Range'): ConfigRange => ({
  id: crypto.randomUUID(),
  name,
  startDate,
  endDate,
  enabled: true,
  skipWeekdays: [],
  weekendBehavior: 'reduced',
  intensity: {
    level: 'moderate',
    minPerDay: 1,
    maxPerDay: 4,
    distributionCurve: 'flat',
    activeDayPercentage: 80,
  },
  time: {
    profile: 'office-hours',
  },
  style: {
    messageStyle: 'conventional',
    conventionalTypes: ['feat', 'fix', 'chore', 'docs', 'refactor'],
    authorName: 'Dev User',
    authorEmail: 'dev@example.com',
    branchName: 'main',
  },
  advanced: {
    seed: '',
    fileChangeMode: 'single-file',
    commitSizeVariance: true,
    includeReadme: true,
    readmeContent: '# my-project\n\nA project with a rich commit history.',
    gpgSign: false,
  },
});

export const DEFAULT_CONFIG: GeneratorConfig = {
  repoName: 'my-project',
  skipDates: [],
  ranges: [
    createDefaultRange(format(threeMonthsAgo, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'))
  ],
};

export type AppMode = 'idle' | 'create' | 'modify';

interface GeneratorStore {
  appMode: AppMode;
  currentStep: number;
  config: GeneratorConfig;
  previewPlan: CommitPlan[];
  manualOverrides: Record<string, CommitPlan[]>; // date -> commits
  uploadedCommits: ParsedCommit[];
  uploadedFile: File | null;
  selectedDate: string | null;
  isGenerating: boolean;
  generationProgress: number;

  setAppMode: (mode: AppMode) => void;
  setStep: (step: number) => void;
  
  updateGlobalConfig: (partial: Partial<Omit<GeneratorConfig, 'ranges'>>) => void;
  
  addRange: (startDate: string, endDate: string, name?: string) => void;
  removeRange: (id: string) => void;
  updateRange: (id: string, partial: Partial<ConfigRange>) => void;
  
  setPreviewPlan: (plan: CommitPlan[]) => void;
  setUploadedCommits: (commits: ParsedCommit[]) => void;
  setUploadedFile: (file: File | null) => void;
  setSelectedDate: (date: string | null) => void;
  updateManualOverride: (date: string, commits: CommitPlan[]) => void;
  setIsGenerating: (v: boolean) => void;
  setProgress: (v: number) => void;
  resetConfig: () => void;
}

export const useGeneratorStore = create<GeneratorStore>()(
  persist(
    (set) => ({
      appMode: 'idle',
      currentStep: 1,
      config: DEFAULT_CONFIG,
      previewPlan: [],
      manualOverrides: {},
      uploadedCommits: [],
      uploadedFile: null,
      selectedDate: null,
      isGenerating: false,
      generationProgress: 0,

      setAppMode: (mode) => set({ appMode: mode }),
      setStep: (step) => set({ currentStep: step }),
      
      updateGlobalConfig: (partial) =>
        set((s) => ({ config: { ...s.config, ...partial } })),
      
      addRange: (startDate, endDate, name) =>
        set((s) => ({
          config: {
            ...s.config,
            ranges: [...(s.config.ranges || []), createDefaultRange(startDate, endDate, name)],
          },
        })),
        
      removeRange: (id) =>
        set((s) => ({
          config: {
            ...s.config,
            ranges: (s.config.ranges || []).filter((r) => r.id !== id),
          },
        })),
        
      updateRange: (id, partial) =>
        set((s) => ({
          config: {
            ...s.config,
            ranges: (s.config.ranges || []).map((r) =>
              r.id === id ? { ...r, ...partial } : r
            ),
          },
        })),

      setPreviewPlan: (plan) => set({ previewPlan: plan }),
      setUploadedCommits: (commits) => set({ uploadedCommits: commits }),
      setUploadedFile: (file) => set({ uploadedFile: file }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      updateManualOverride: (date, commits) =>
        set((s) => ({
          manualOverrides: { ...s.manualOverrides, [date]: commits },
        })),
      setIsGenerating: (v) => set({ isGenerating: v }),
      setProgress: (v) => set({ generationProgress: v }),
      resetConfig: () => set({ 
        config: DEFAULT_CONFIG, 
        currentStep: 1, 
        previewPlan: [], 
        manualOverrides: {}, 
        uploadedCommits: [],
        uploadedFile: null,
        selectedDate: null,
        appMode: 'idle'
      }),
    }),
    { name: 'gitpainter-config-v3' }
  )
);
