'use client';
import { useState, useCallback, useMemo } from 'react';
import { useGeneratorStore } from '@/store/generatorStore';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import { DayEditor } from '@/components/DayEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function ModifyPage() {
  const { 
    setAppMode, 
    uploadedCommits, 
    setUploadedCommits, 
    uploadedFile,
    setUploadedFile,
    selectedDate, 
    setSelectedDate,
    manualOverrides,
    setPreviewPlan,
    previewPlan,
    isGenerating,
    setIsGenerating,
    setProgress
  } = useGeneratorStore();
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    setError('');
    setUploadedFile(file);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-git', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to parse repository');
      }

      const commits = await res.json();
      setUploadedCommits(commits);
      
      // Convert parsed commits to preview plan
      const plan = commits.map((c: any) => ({
        date: format(new Date(c.authorDate), 'yyyy-MM-dd'),
        datetime: new Date(c.authorDate),
        message: c.message,
        filesChanged: []
      }));
      setPreviewPlan(plan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentPlan = useMemo(() => {
    let plan = [...previewPlan];
    
    // Apply manual overrides
    const overrideDates = Object.keys(manualOverrides);
    if (overrideDates.length > 0) {
      plan = plan.filter(c => !manualOverrides[c.date]);
      overrideDates.forEach(date => {
        plan.push(...manualOverrides[date]);
      });
      plan.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
    }
    return plan;
  }, [previewPlan, manualOverrides]);

  const stats = useMemo(() => {
    return {
      total: currentPlan.length,
      days: new Set(currentPlan.map(c => c.date)).size
    };
  }, [currentPlan]);

  const handleDownload = async () => {
    if (!uploadedFile) return;

    setIsGenerating(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('overrides', JSON.stringify(manualOverrides));

      const res = await fetch('/api/modify', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Modification failed');
      }

      const blob = await res.blob();
      const { saveAs } = await import('file-saver');
      saveAs(blob, `modified-${uploadedFile.name}`);
      setProgress(100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setAppMode('idle'); router.push('/'); }}>
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-sm">
              🎨
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">Git Painter</h1>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Modify Existing Repository</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setAppMode('idle'); router.push('/'); }} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {uploadedCommits.length === 0 ? (
          <div className="max-w-xl mx-auto text-center space-y-6 py-20">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl mx-auto mb-6">
              📂
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Upload your repository</h2>
              <p className="text-muted-foreground">Upload a .zip file containing your .git folder to get started.</p>
            </div>
            
            <div className="relative group">
              <Input 
                type="file" 
                accept=".zip" 
                onChange={handleUpload}
                disabled={isGenerating}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-border group-hover:border-primary/50 transition-colors rounded-xl p-10 flex flex-col items-center gap-4 bg-card/50">
                {isGenerating && uploadedCommits.length === 0 ? (
                  <>
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-sm font-medium">Parsing repository...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">Only .zip files containing a .git folder</p>
                  </>
                )}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <div className="flex gap-8">
            <div className="flex-1 space-y-6 overflow-hidden">
              <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 shadow-xl shadow-black/20 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Commit History</h3>
                    <p className="text-sm text-muted-foreground">Select a day in the heatmap to add or modify commits.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.total}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">commits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.days}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">active days</div>
                    </div>
                  </div>
                </div>
                
                <CalendarHeatmap 
                  plan={currentPlan}
                  onDayClick={setSelectedDate}
                  selectedDate={selectedDate}
                />
              </div>

              <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 shadow-xl shadow-black/20">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider text-muted-foreground">Recent Changes</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {currentPlan.slice().reverse().slice(0, 50).map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20 group hover:border-primary/30 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{c.message}</span>
                        <span className="text-[11px] text-muted-foreground">{format(c.datetime, 'MMM d, yyyy HH:mm')}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDate(c.date)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-[350px] space-y-4">
              {selectedDate ? (
                <DayEditor />
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card/30">
                  <p className="text-sm text-muted-foreground">Select a day on the heatmap to start editing.</p>
                </div>
              )}
              
              <Button 
                className="w-full h-12 text-base gap-2 shadow-lg shadow-primary/20" 
                size="lg"
                disabled={isGenerating}
                onClick={handleDownload}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" /> Download Modified Repo
                  </>
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground px-4">
                This will generate a new .zip with all original commits plus your modifications.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
