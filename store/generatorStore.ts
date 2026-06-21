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

  githubUsername: string | null;
  githubContributions: Record<string, number> | null;
  showCombined: boolean;
  githubLoading: boolean;
  githubError: string | null;

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

  setGithubUsername: (u: string | null) => void;
  setGithubContributions: (c: Record<string, number> | null) => void;
  setShowCombined: (v: boolean) => void;
  setGithubLoading: (v: boolean) => void;
  setGithubError: (e: string | null) => void;
  disconnectGithub: () => void;
  fetchGithubContributions: (usernameOrUrl: string) => Promise<void>;
}

function extractGithubUsername(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const urlMatch = trimmed.match(/(?:github\.com\/|^)([a-zA-Z0-9-]{1,39})(?:\/|\?|$)/);
  return urlMatch ? urlMatch[1] : trimmed;
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

      githubUsername: null,
      githubContributions: null,
      showCombined: true,
      githubLoading: false,
      githubError: null,

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
        appMode: 'idle',
        githubUsername: null,
        githubContributions: null,
        showCombined: true,
        githubLoading: false,
        githubError: null,
      }),

      setGithubUsername: (u) => set({ githubUsername: u }),
      setGithubContributions: (c) => set({ githubContributions: c }),
      setShowCombined: (v) => set({ showCombined: v }),
      setGithubLoading: (v) => set({ githubLoading: v }),
      setGithubError: (e) => set({ githubError: e }),
      disconnectGithub: () => set({
        githubUsername: null,
        githubContributions: null,
        githubError: null,
        githubLoading: false,
      }),
      fetchGithubContributions: async (usernameOrUrl) => {
        const username = extractGithubUsername(usernameOrUrl);
        if (!username) {
          set({ githubError: 'Please enter a valid GitHub username or profile link.' });
          return;
        }

        set({ githubLoading: true, githubError: null });
        try {
          const res = await fetch(`/api/github-contributions?username=${encodeURIComponent(username)}`);
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Failed to fetch contributions.');
          }

          set({
            githubUsername: username,
            githubContributions: data.contributions,
            githubLoading: false,
            githubError: null,
          });
        } catch (err: any) {
          set({
            githubLoading: false,
            githubError: err.message || 'An error occurred while connecting to GitHub.',
          });
        }
      },
    }),
    { name: 'gitpainter-config-v3' }
  )
);
