'use client';
import { useMemo, useState } from 'react';
import { CommitPlan } from '@/lib/types';
import { format, addDays, eachWeekOfInterval, parseISO, startOfYear, endOfYear, eachDayOfInterval, getYear, isSameDay } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  plan: CommitPlan[];
  startDate?: string;
  endDate?: string;
  skipDates?: string[];
  onDayClick?: (date: string) => void;
  selectedDate?: string | null;
}

function getColor(count: number): string {
  if (count === 0) return 'bg-[#161b22]'; // GitHub dark theme empty cell
  if (count <= 2) return 'bg-[#0e4429]';
  if (count <= 5) return 'bg-[#006d32]';
  if (count <= 9) return 'bg-[#26a641]';
  return 'bg-[#39d353]';
}

export function CalendarHeatmap({ plan, startDate, endDate, skipDates = [], onDayClick, selectedDate }: Props) {
  const [activeYear, setActiveYear] = useState<number>(() => {
    if (endDate) return getYear(parseISO(endDate));
    if (plan.length > 0) {
      // Find the latest year in the plan
      const latest = plan.reduce((acc, curr) => curr.datetime > acc.datetime ? curr : acc, plan[0]);
      return getYear(latest.datetime);
    }
    return new Date().getFullYear();
  });

  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    if (startDate && endDate) {
      for (let y = getYear(parseISO(startDate)); y <= getYear(parseISO(endDate)); y++) {
        yearsSet.add(y);
      }
    }
    // Always include at least 4 years or the range
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 4; i++) {
      yearsSet.add(currentYear - i);
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [startDate, endDate]);

  const { weeks, monthLabels } = useMemo(() => {
    const commitMap = new Map<string, number>();
    for (const c of plan) {
      commitMap.set(c.date, (commitMap.get(c.date) || 0) + 1);
    }
    const skipSet = new Set(skipDates);

    const yearStart = startOfYear(new Date(activeYear, 0, 1));
    const yearEnd = endOfYear(new Date(activeYear, 0, 1));
    
    // Adjust start to the beginning of the week (Sunday)
    const displayStart = addDays(yearStart, -yearStart.getDay());
    const weekStarts = eachWeekOfInterval({ start: displayStart, end: yearEnd }, { weekStartsOn: 0 });

    const weeks = weekStarts.map((weekStart) =>
      Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i);
        const dateStr = format(day, 'yyyy-MM-dd');
        const inYear = getYear(day) === activeYear;
        
        return {
          date: dateStr,
          count: commitMap.get(dateStr) || 0,
          inYear,
          skipped: skipSet.has(dateStr),
          fullDate: day,
        };
      })
    );

    // Calculate month labels position
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDayOfMonth = week.find(d => d.inYear && d.fullDate.getDate() === 1);
      if (firstDayOfMonth) {
        const month = firstDayOfMonth.fullDate.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ label: format(firstDayOfMonth.fullDate, 'MMM'), weekIndex: wi });
          lastMonth = month;
        }
      }
    });

    return { weeks, monthLabels };
  }, [plan, skipDates, activeYear]);

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <div className="min-w-fit">
            <div className="flex items-center justify-between mb-2 pr-4">
              <div className="relative h-4 w-full ml-8">
                {monthLabels.map((m, i) => (
                  <div 
                    key={i} 
                    className="absolute text-[11px] text-muted-foreground whitespace-nowrap"
                    style={{ left: `${m.weekIndex * 15}px` }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex flex-col justify-between py-1 text-[10px] text-muted-foreground h-[105px] sticky left-0 bg-card/50 backdrop-blur-sm z-20 pr-1">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>
              <div className="flex gap-[3px]">
                <TooltipProvider>
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {week.map((day, di) => {
                        const isSelected = selectedDate === day.date;
                        return (
                          <Tooltip key={di}>
                            <TooltipTrigger asChild>
                              <div
                                onClick={() => day.inYear && onDayClick?.(day.date)}
                                className={`w-[12px] h-[12px] rounded-[2px] cursor-pointer transition-all duration-200 ${
                                  !day.inYear
                                    ? 'bg-transparent pointer-events-none'
                                    : day.skipped
                                    ? 'bg-red-900/40 border border-red-500/20'
                                    : isSelected
                                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background z-10'
                                    : getColor(day.count)
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[11px] px-2 py-1">
                              <span className="font-medium">{day.count} contributions</span> on {format(day.fullDate, 'MMM d, yyyy')}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
          <div className="hover:text-primary cursor-pointer transition-colors truncate pr-2">
            Learn how we count contributions
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span>Less</span>
            {['bg-[#161b22]', 'bg-[#0e4429]', 'bg-[#006d32]', 'bg-[#26a641]', 'bg-[#39d353]'].map((c, i) => (
              <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 pt-6 shrink-0">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setActiveYear(y)}
            className={`px-3 py-1 rounded-md text-[13px] font-medium transition-all cursor-pointer ${
              activeYear === y
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  );
}
