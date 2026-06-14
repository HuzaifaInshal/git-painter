'use client';
import { useGeneratorStore } from '@/store/generatorStore';
import { CommitPlan } from '@/lib/types';
import { format, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function DayEditor() {
  const { selectedDate, setSelectedDate, manualOverrides, updateManualOverride, previewPlan, appMode, uploadedCommits } = useGeneratorStore();
  const [dayCommits, setDayCommits] = useState<CommitPlan[]>([]);

  useEffect(() => {
    if (!selectedDate) return;

    // First check manual overrides
    if (manualOverrides[selectedDate]) {
      setDayCommits(manualOverrides[selectedDate]);
    } else {
      // Otherwise find in current previewPlan or uploadedCommits
      if (appMode === 'modify') {
        const existing = uploadedCommits
          .filter(c => format(new Date(c.authorDate), 'yyyy-MM-dd') === selectedDate)
          .map(c => ({
            date: selectedDate,
            datetime: new Date(c.authorDate),
            message: c.message,
            filesChanged: [] // We don't have file details for uploaded commits easily
          }));
        setDayCommits(existing);
      } else {
        const existing = previewPlan.filter(c => c.date === selectedDate);
        setDayCommits(existing);
      }
    }
  }, [selectedDate, manualOverrides, previewPlan, appMode, uploadedCommits]);

  if (!selectedDate) return null;

  const handleAddCommit = () => {
    const newCommit: CommitPlan = {
      date: selectedDate,
      datetime: new Date(`${selectedDate}T12:00:00`),
      message: 'new commit',
      filesChanged: [{ path: 'activity-log.txt', content: `// update at ${new Date().toISOString()}\n` }]
    };
    const updated = [...dayCommits, newCommit];
    setDayCommits(updated);
    updateManualOverride(selectedDate, updated);
  };

  const handleUpdateCommit = (index: number, partial: Partial<CommitPlan>) => {
    const updated = dayCommits.map((c, i) => i === index ? { ...c, ...partial } : c);
    setDayCommits(updated);
    updateManualOverride(selectedDate, updated);
  };

  const handleDeleteCommit = (index: number) => {
    const updated = dayCommits.filter((_, i) => i !== index);
    setDayCommits(updated);
    updateManualOverride(selectedDate, updated);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-4 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </h3>
          <p className="text-[10px] text-muted-foreground">{dayCommits.length} commits</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
        {dayCommits.map((commit, i) => (
          <div key={i} className="group p-2 rounded-lg bg-muted/50 border border-border/30 relative">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground">Message</Label>
                  <Input 
                    value={commit.message} 
                    onChange={(e) => handleUpdateCommit(i, { message: e.target.value })}
                    className="h-7 text-xs px-2"
                  />
                </div>
                <div className="w-20">
                  <Label className="text-[10px] text-muted-foreground">Time</Label>
                  <Input 
                    type="time"
                    value={format(commit.datetime, 'HH:mm')}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':');
                      const newDate = new Date(commit.datetime);
                      newDate.setHours(parseInt(h), parseInt(m));
                      handleUpdateCommit(i, { datetime: newDate });
                    }}
                    className="h-7 text-xs px-1"
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleDeleteCommit(i)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {dayCommits.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-xs italic">
            No commits on this day
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" className="w-full mt-4 h-8 text-xs gap-1.5" onClick={handleAddCommit}>
        <Plus className="h-3.5 w-3.5" /> Add Commit
      </Button>
    </div>
  );
}
