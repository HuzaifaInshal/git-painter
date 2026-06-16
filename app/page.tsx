'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useGeneratorStore } from '@/store/generatorStore';
import { generateCommitPlan } from '@/lib/commitGenerator';
import { StepDateRange } from '@/components/steps/StepDateRange';
import { StepIntensity } from '@/components/steps/StepIntensity';
import { StepCommitStyle } from '@/components/steps/StepCommitStyle';
import { StepAdvanced } from '@/components/steps/StepAdvanced';
import { StepReview } from '@/components/steps/StepReview';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import { DayEditor } from '@/components/DayEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Date Range', icon: '📅' },
  { number: 2, label: 'Intensity', icon: '⚡' },
  { number: 3, label: 'Style', icon: '🎨' },
  { number: 4, label: 'Advanced', icon: '⚙️' },
  { number: 5, label: 'Review', icon: '🚀' },
];

function StepComponent({ step }: { step: number }) {
  switch (step) {
    case 1: return <StepDateRange />;
    case 2: return <StepIntensity />;
    case 3: return <StepCommitStyle />;
    case 4: return <StepAdvanced />;
    case 5: return <StepReview />;
    default: return <StepDateRange />;
  }
}

export default function Home() {
  const { 
    currentStep, 
    setStep, 
    config, 
    previewPlan, 
    setPreviewPlan, 
    appMode, 
    setAppMode,
    selectedDate,
    setSelectedDate,
    manualOverrides
  } = useGeneratorStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const updatePreview = useCallback(() => {
    if (appMode !== 'create') return;
    try {
      let plan = generateCommitPlan(config);

      // Apply manual overrides
      const overrideDates = Object.keys(manualOverrides);
      if (overrideDates.length > 0) {
        // Filter out generated commits for overridden dates
        plan = plan.filter(c => !manualOverrides[c.date]);
        // Add manual commits
        overrideDates.forEach(date => {
          plan.push(...manualOverrides[date]);
        });
        // Re-sort
        plan.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
      }

      setPreviewPlan(plan);
    } catch {
      // ignore preview errors
    }
  }, [config, setPreviewPlan, appMode, manualOverrides]);

  useEffect(() => {
    const timer = setTimeout(updatePreview, 300);
    return () => clearTimeout(timer);
  }, [updatePreview]);

  // Animate step content on change
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
    return () => cancelAnimationFrame(raf);
  }, [currentStep]);

  if (appMode === 'idle') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 group"
            onClick={() => setAppMode('create')}
          >
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                🎨
              </div>
              <CardTitle className="text-2xl">Create New Repo</CardTitle>
              <CardDescription>Generate a fresh repository with a custom contribution pattern from scratch.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full">Get Started</Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 group"
            onClick={() => {
              setAppMode('modify');
              router.push('/modify');
            }}
          >
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                📂
              </div>
              <CardTitle className="text-2xl">Modify Existing</CardTitle>
              <CardDescription>Upload a .git zip to extend its history or modify existing commits.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">Upload Repo</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-primary/4 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAppMode('idle')}>
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-sm">
              🎨
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">Git Painter</h1>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Paint your GitHub contribution graph</p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 gap-1 pt-1 sticky top-24 h-fit">
          {/* Progress bar */}
          <div className="mb-4 px-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>Progress</span>
              <span>{currentStep}/{STEPS.length}</span>
            </div>
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {STEPS.map((s) => {
            const isActive = currentStep === s.number;
            const isDone = currentStep > s.number;
            return (
              <button
                key={s.number}
                onClick={() => setStep(s.number)}
                className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/25 glow-green'
                    : isDone
                    ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isDone
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? '✓' : s.number}
                </span>
                <span className={`font-medium ${isActive ? '' : 'group-hover:translate-x-0.5 transition-transform'}`}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Mobile step tabs */}
          <div className="flex md:hidden gap-1 mb-4 overflow-x-auto pb-1 scrollbar-none">
            {STEPS.map((s) => (
              <button
                key={s.number}
                onClick={() => setStep(s.number)}
                className={`px-3 py-1.5 rounded-lg text-xs shrink-0 font-medium transition-all duration-200 ${
                  currentStep === s.number
                    ? 'bg-primary/15 text-primary border border-primary/25'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {/* Live preview panel - NOW AT TOP */}
          <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 shadow-xl shadow-black/20 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium animate-pulse">
                  LIVE
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-end">
                  <div className="text-sm font-bold text-primary tabular-nums">{previewPlan.length}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">commits</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-sm font-bold text-primary tabular-nums">
                    {new Set(previewPlan.map((c) => c.date)).size}
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">active days</div>
                </div>
              </div>
            </div>
            
            <CalendarHeatmap
              plan={previewPlan}
              startDate={config.ranges.reduce((min, r) => r.startDate < min ? r.startDate : min, config.ranges[0]?.startDate || '')}
              endDate={config.ranges.reduce((max, r) => r.endDate > max ? r.endDate : max, config.ranges[0]?.endDate || '')}
              skipDates={config.skipDates}
              onDayClick={setSelectedDate}
              selectedDate={selectedDate}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className={`${selectedDate ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-4`}>
              {/* Step card */}
              <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 shadow-xl shadow-black/20 transition-all duration-300">
                <div ref={contentRef}>
                  <StepComponent step={currentStep} />
                </div>
              </div>

              {/* Navigation */}
              {currentStep < 5 && (
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className="border-border/60 hover:bg-accent transition-all duration-200 gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={() => setStep(Math.min(5, currentStep + 1))}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20 gap-1.5"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="xl:col-span-4 sticky top-20 animate-in slide-in-from-right-4 duration-300">
                <DayEditor />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
