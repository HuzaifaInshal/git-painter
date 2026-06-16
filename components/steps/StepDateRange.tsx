'use client';
import { useGeneratorStore } from '@/store/generatorStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { WeekendBehavior } from '@/lib/types';

const QUICK_RANGES = [
  { label: 'Last 30 days', start: () => subDays(new Date(), 30) },
  { label: 'Last 3 months', start: () => subMonths(new Date(), 3) },
  { label: 'Last 6 months', start: () => subMonths(new Date(), 6) },
  { label: 'Last year', start: () => subYears(new Date(), 1) },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKEND_OPTIONS = [
  { value: 'skip', label: 'Skip weekends' },
  { value: 'reduced', label: 'Reduced activity' },
  { value: 'same', label: 'Same as weekdays' },
  { value: 'only-weekends', label: 'Weekends only' },
] as const;

export function StepDateRange() {
  const { config, updateGlobalConfig, addRange, removeRange, updateRange } = useGeneratorStore();
  const { ranges = [] } = config;

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleAddRange = () => {
    const lastRange = ranges[ranges.length - 1];
    addRange(lastRange?.startDate || today, lastRange?.endDate || today);
  };

  const toggleRangeWeekday = (rangeId: string, currentSkip: number[], dow: number) => {
    updateRange(rangeId, {
      skipWeekdays: currentSkip.includes(dow) ? currentSkip.filter((d) => d !== dow) : [...currentSkip, dow],
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Date Ranges</h2>
          <Button size="sm" variant="outline" onClick={handleAddRange} className="gap-1 border-dashed">
            <Plus className="w-4 h-4" /> Add Range
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Configure periods for commit generation. Each range has its own calendar rules.</p>

        <div className="space-y-6">
          {ranges.map((range, idx) => (
            <Card key={range.id} className="p-5 space-y-6 relative border-border/60 bg-card/30">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <Input 
                    value={range.name}
                    onChange={(e) => updateRange(range.id, { name: e.target.value })}
                    className="h-8 font-medium bg-transparent border-none focus-visible:ring-1 p-0 px-2"
                    placeholder="Range name"
                  />
                </div>
                {idx > 0 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => removeRange(range.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Start Date</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={range.startDate}
                    onChange={(e) => updateRange(range.id, { startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">End Date</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={range.endDate}
                    onChange={(e) => updateRange(range.id, { endDate: e.target.value })}
                  />
                </div>
              </div>

              {idx === 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_RANGES.map((r) => (
                    <Button
                      key={r.label}
                      variant="secondary"
                      size="sm"
                      className="h-7 text-[10px] px-2.5"
                      onClick={() =>
                        updateRange(range.id, {
                          startDate: format(r.start(), 'yyyy-MM-dd'),
                          endDate: today,
                        })
                      }
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/30">
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Skip Weekdays</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {WEEKDAYS.map((day, i) => (
                      <button
                        key={day}
                        onClick={() => toggleRangeWeekday(range.id, range.skipWeekdays, i)}
                        className={`w-9 h-8 rounded flex items-center justify-center text-[11px] border transition-colors ${
                          range.skipWeekdays.includes(i)
                            ? 'bg-red-500/10 border-red-500/30 text-red-500 font-bold'
                            : 'bg-background border-border hover:bg-accent'
                        }`}
                      >
                        {day[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Weekend Behavior</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {WEEKEND_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateRange(range.id, { weekendBehavior: opt.value })}
                        className={`py-1.5 px-2 rounded border text-[10px] text-center transition-colors ${
                          range.weekendBehavior === opt.value
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
