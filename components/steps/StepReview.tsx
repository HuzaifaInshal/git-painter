'use client';
import { useEffect, useState, useCallback } from 'react';
import { useGeneratorStore } from '@/store/generatorStore';
import { generateCommitPlan } from '@/lib/commitGenerator';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import { GenerationProgress } from '@/components/GenerationProgress';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';

export function StepReview() {
  const { config, previewPlan, setPreviewPlan, isGenerating, setIsGenerating, generationProgress, setProgress } =
    useGeneratorStore();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const regenerate = useCallback(() => {
    const plan = generateCommitPlan(config);
    setPreviewPlan(plan);
  }, [config, setPreviewPlan]);

  useEffect(() => {
    regenerate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      setProgress(95);
      const blob = await res.blob();
      setProgress(100);

      const { saveAs } = await import('file-saver');
      saveAs(blob, `${config.repoName}.zip`);
      setSuccess(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const sample = [...previewPlan.slice(0, 5), ...previewPlan.slice(-5)];

  const minDate = config.ranges.reduce((min, r) => r.startDate < min ? r.startDate : min, config.ranges[0]?.startDate || '');
  const maxDate = config.ranges.reduce((max, r) => r.endDate > max ? r.endDate : max, config.ranges[0]?.endDate || '');
  const finalBranch = config.ranges[config.ranges.length - 1]?.style.branchName || 'main';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Review & Generate</h2>
        <p className="text-sm text-muted-foreground">
          {previewPlan.length} commits across {new Set(previewPlan.map((c) => c.date)).size} days
        </p>
      </div>

      <div className="p-4 border rounded-lg space-y-1">
        <div className="grid grid-cols-2 gap-x-4 text-sm">
          <span className="text-muted-foreground">Full period</span>
          <span className="flex items-center gap-1.5">
            {minDate} 
            <ChevronRight className="h-3 w-3 text-muted-foreground" /> 
            {maxDate}
          </span>
          <span className="text-muted-foreground">Repo name</span>
          <span>{config.repoName}</span>
          <span className="text-muted-foreground">Final Branch</span>
          <span>{finalBranch}</span>
          <span className="text-muted-foreground">Segments</span>
          <span>{config.ranges.length} range(s) configured</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Commit Preview</h3>
        <CalendarHeatmap
          plan={previewPlan}
          startDate={minDate}
          endDate={maxDate}
          skipDates={config.skipDates}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Sample Commits</h3>
        <div className="space-y-1 text-sm font-mono border rounded p-3 max-h-48 overflow-y-auto">
          {sample.map((c, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-muted-foreground shrink-0">{format(c.datetime, 'yyyy-MM-dd HH:mm')}</span>
              <span className="truncate">{c.message}</span>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" onClick={regenerate} size="sm">
        Regenerate Preview
      </Button>

      {isGenerating && (
        <GenerationProgress
          progress={generationProgress}
          commitCount={Math.round((generationProgress / 100) * previewPlan.length)}
          total={previewPlan.length}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-sm space-y-2">
          <p className="font-medium text-green-800">Download started!</p>
          <ol className="list-decimal list-inside space-y-1 text-green-700">
            <li>Unzip the downloaded file</li>
            <li><code>cd {config.repoName}</code></li>
            <li><code>git remote add origin https://github.com/yourname/repo.git</code></li>
            <li><code>git push -u origin {finalBranch} --force</code></li>
          </ol>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleGenerate}
        disabled={isGenerating || previewPlan.length === 0}
      >
        {isGenerating ? 'Generating...' : `Generate & Download (${previewPlan.length} commits)`}
      </Button>
    </div>
  );
}
