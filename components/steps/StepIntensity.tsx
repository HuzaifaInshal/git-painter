'use client';
import { useGeneratorStore } from '@/store/generatorStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { IntensityLevel, DistributionCurve, IntensityConfig } from '@/lib/types';
import { ProfileAccordion } from '@/components/ProfileAccordion';

const INTENSITY_PRESETS: { level: IntensityLevel; label: string; min: number; max: number; colors: string }[] = [
  { level: 'minimal', label: 'Minimal', min: 1, max: 2, colors: 'bg-green-200' },
  { level: 'light', label: 'Light', min: 1, max: 3, colors: 'bg-green-300' },
  { level: 'moderate', label: 'Moderate', min: 2, max: 5, colors: 'bg-green-400' },
  { level: 'heavy', label: 'Heavy', min: 3, max: 8, colors: 'bg-green-600' },
  { level: 'extreme', label: 'Extreme', min: 5, max: 15, colors: 'bg-green-800' },
];

const CURVES: { value: DistributionCurve; label: string; desc: string }[] = [
  { value: 'flat', label: 'Flat', desc: 'Uniform' },
  { value: 'ramp-up', label: 'Ramp Up', desc: 'Increases over time' },
  { value: 'ramp-down', label: 'Ramp Down', desc: 'Decreases over time' },
  { value: 'bell', label: 'Bell', desc: 'Peak in middle' },
  { value: 'random-spikes', label: 'Spikes', desc: 'Occasional bursts' },
];

interface IntensityEditorProps {
  intensity: IntensityConfig;
  onChange: (partial: Partial<IntensityConfig>) => void;
}

function IntensityEditor({ intensity, onChange }: IntensityEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Intensity Preset</Label>
        <div className="grid grid-cols-5 gap-2">
          {INTENSITY_PRESETS.map((p) => (
            <button
              key={p.level}
              onClick={() => onChange({ level: p.level, minPerDay: p.min, maxPerDay: p.max })}
              className={`p-3 rounded border text-sm flex flex-col items-center gap-1 transition-colors ${
                intensity.level === p.level
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <div className={`w-6 h-6 rounded ${p.colors}`} />
              <span>{p.label}</span>
              <span className="text-xs text-muted-foreground">{p.min}–{p.max}/day</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Min commits/day</Label>
          <Input
            type="number"
            min={1}
            max={intensity.maxPerDay}
            value={intensity.minPerDay}
            onChange={(e) => onChange({ minPerDay: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-1">
          <Label>Max commits/day</Label>
          <Input
            type="number"
            min={intensity.minPerDay}
            max={50}
            value={intensity.maxPerDay}
            onChange={(e) => onChange({ maxPerDay: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Active days: {intensity.activeDayPercentage}%</Label>
        <Slider
          min={10}
          max={100}
          step={5}
          value={[intensity.activeDayPercentage]}
          onValueChange={(vals) => onChange({ activeDayPercentage: Array.isArray(vals) ? vals[0] : vals })}
        />
        <p className="text-xs text-muted-foreground">{intensity.activeDayPercentage}% of days in this range will have commits</p>
      </div>

      <div className="space-y-2">
        <Label>Distribution Curve</Label>
        <div className="grid grid-cols-5 gap-2">
          {CURVES.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange({ distributionCurve: c.value })}
              className={`p-2 rounded border text-xs flex flex-col items-center gap-1 transition-colors ${
                intensity.distributionCurve === c.value
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <span className="font-medium">{c.label}</span>
              <span className="text-muted-foreground text-center leading-tight">{c.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StepIntensity() {
  const { config, updateRange, previewPlan } = useGeneratorStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Commit Intensity</h2>
        <p className="text-sm text-muted-foreground">How many commits per day and how often</p>
      </div>

      <ProfileAccordion
        title="Intensity"
        renderRange={(range) => (
          <IntensityEditor 
            intensity={range.intensity} 
            onChange={(partial) => updateRange(range.id, { 
              intensity: { ...range.intensity, ...partial } 
            })} 
          />
        )}
      />

      <div className="p-3 bg-muted rounded text-sm">
        Total planned commits: <span className="font-medium">{previewPlan.length}</span>
      </div>
    </div>
  );
}
