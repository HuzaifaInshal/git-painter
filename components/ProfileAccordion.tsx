import { ConfigRange } from '@/lib/types';
import { useGeneratorStore } from '@/store/generatorStore';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';

interface ProfileAccordionProps {
  title: string;
  renderRange: (range: ConfigRange, index: number) => React.ReactNode;
}

export function ProfileAccordion({ title, renderRange }: ProfileAccordionProps) {
  const { config, removeRange, updateRange } = useGeneratorStore();
  const ranges = config.ranges || [];
  const [expanded, setExpanded] = useState<string | null>(ranges[0]?.id || null);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {ranges.map((range, idx) => (
          <Card key={range.id} className={`overflow-hidden ${idx === 0 ? 'border-primary/20' : ''}`}>
            <div className="p-3 flex items-center justify-between bg-muted/30">
              <button
                onClick={() => setExpanded(expanded === range.id ? null : range.id)}
                className="flex items-center gap-4 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                   <div className="font-semibold text-sm">
                    {idx === 0 ? `Default ${title}` : range.name || `Range ${idx + 1}`}
                   </div>
                   <span className="text-xs text-muted-foreground">({range.startDate} to {range.endDate})</span>
                </div>
              </button>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setExpanded(expanded === range.id ? null : range.id)}
                >
                  {expanded === range.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                {idx > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRange(range.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {expanded === range.id && (
              <div className="p-4 border-t">
                {renderRange(range, idx)}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
