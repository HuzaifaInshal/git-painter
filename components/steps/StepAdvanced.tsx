'use client';
import { useGeneratorStore } from '@/store/generatorStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TimeOfDayProfile, AdvancedConfig, TimeConfig } from '@/lib/types';
import { useState } from 'react';
import { ProfileAccordion } from '@/components/ProfileAccordion';

const TIME_PROFILES: { value: TimeOfDayProfile; label: string; desc: string }[] = [
  { value: 'office-hours', label: 'Office Hours', desc: '9am–6pm' },
  { value: 'night-owl', label: 'Night Owl', desc: '8pm–2am' },
  { value: 'random', label: 'Random', desc: 'Any time' },
  { value: 'custom', label: 'Custom Range', desc: 'Set your hours' },
];

const FILE_MODES = [
  { value: 'single-file', label: 'Single File', desc: 'Writes to activity-log.txt' },
  { value: 'multi-file', label: 'Multiple Files', desc: 'Rotates among src files' },
  { value: 'empty-commits', label: 'Empty Commits', desc: 'No file changes (looks fake)' },
] as const;

interface AdvancedEditorProps {
  advanced: AdvancedConfig;
  time: TimeConfig;
  onUpdateAdvanced: (partial: Partial<AdvancedConfig>) => void;
  onUpdateTime: (partial: Partial<TimeConfig>) => void;
}

function AdvancedEditor({ advanced, time, onUpdateAdvanced, onUpdateTime }: AdvancedEditorProps) {
  const [copied, setCopied] = useState(false);

  const generateSeed = () => {
    const seed = Math.random().toString(36).substring(2, 10);
    onUpdateAdvanced({ seed });
  };

  const copySeed = () => {
    navigator.clipboard.writeText(advanced.seed || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Time of Day Profile</Label>
        <div className="grid grid-cols-2 gap-2">
          {TIME_PROFILES.map((p) => (
            <button
              key={p.value}
              onClick={() => onUpdateTime({ profile: p.value })}
              className={`p-3 rounded border text-sm text-left transition-colors ${
                time.profile === p.value
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <div className="font-medium">{p.label}</div>
              <div className="text-xs text-muted-foreground">{p.desc}</div>
            </button>
          ))}
        </div>
        {time.profile === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1">
              <Label>Start Hour (0–23)</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={time.customStartHour ?? 9}
                onChange={(e) => onUpdateTime({ customStartHour: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>End Hour (0–23)</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={time.customEndHour ?? 18}
                onChange={(e) => onUpdateTime({ customEndHour: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>File Change Mode</Label>
        <div className="space-y-2">
          {FILE_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onUpdateAdvanced({ fileChangeMode: m.value })}
              className={`w-full p-3 rounded border text-sm text-left transition-colors ${
                advanced.fileChangeMode === m.value
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <div className="font-medium">{m.label}</div>
              <div className="text-xs text-muted-foreground">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Commit Size Variance</Label>
          <p className="text-xs text-muted-foreground">Vary content length per commit</p>
        </div>
        <Switch
          checked={advanced.commitSizeVariance}
          onCheckedChange={(v) => onUpdateAdvanced({ commitSizeVariance: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Include README</Label>
          <p className="text-xs text-muted-foreground">Add a README.md to the repo</p>
        </div>
        <Switch
          checked={advanced.includeReadme}
          onCheckedChange={(v) => onUpdateAdvanced({ includeReadme: v })}
        />
      </div>

      {advanced.includeReadme && (
        <div className="space-y-1">
          <Label>README Content</Label>
          <textarea
            className="w-full h-24 p-2 border rounded text-sm font-mono resize-none bg-background"
            value={advanced.readmeContent || ''}
            onChange={(e) => onUpdateAdvanced({ readmeContent: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Reproducibility Seed</Label>
        <div className="flex gap-2">
          <Input
            value={advanced.seed || ''}
            onChange={(e) => onUpdateAdvanced({ seed: e.target.value })}
            placeholder="Leave empty for random"
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={generateSeed}>Generate</Button>
          <Button variant="outline" size="sm" onClick={copySeed}>{copied ? 'Copied!' : 'Copy'}</Button>
        </div>
        <p className="text-xs text-muted-foreground">Same seed = identical output every time</p>
      </div>
    </div>
  );
}

export function StepAdvanced() {
  const { config, updateRange } = useGeneratorStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Advanced Settings</h2>
        <p className="text-sm text-muted-foreground">Fine-tune commit timing and file behavior</p>
      </div>

      <ProfileAccordion
        title="Advanced"
        renderRange={(range) => (
          <AdvancedEditor 
            advanced={range.advanced}
            time={range.time}
            onUpdateAdvanced={(partial) => updateRange(range.id, { 
              advanced: { ...range.advanced, ...partial } 
            })}
            onUpdateTime={(partial) => updateRange(range.id, { 
              time: { ...range.time, ...partial } 
            })}
          />
        )}
      />
    </div>
  );
}
