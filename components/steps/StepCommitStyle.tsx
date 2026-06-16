'use client';
import { useGeneratorStore } from '@/store/generatorStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CommitMessageStyle, CommitStyleConfig } from '@/lib/types';
import { ProfileAccordion } from '@/components/ProfileAccordion';

const MESSAGE_STYLES: { value: CommitMessageStyle; label: string; example: string }[] = [
  { value: 'conventional', label: 'Conventional Commits', example: 'feat(auth): add OAuth support' },
  { value: 'random-lorem', label: 'Random Dev Messages', example: 'refactor authentication module' },
  { value: 'custom-list', label: 'Custom List', example: 'Your custom message 1' },
  { value: 'simple-counter', label: 'Simple Counter', example: 'commit 42 of 100' },
];

const CONV_TYPES = ['feat', 'fix', 'chore', 'docs', 'refactor', 'test', 'style', 'perf', 'ci', 'build'];

interface StyleEditorProps {
  style: CommitStyleConfig;
  onChange: (partial: Partial<CommitStyleConfig>) => void;
}

function StyleEditor({ style, onChange }: StyleEditorProps) {
  const toggleConvType = (type: string) => {
    const current = style.conventionalTypes || [];
    onChange({
      conventionalTypes: current.includes(type) ? current.filter((t: string) => t !== type) : [...current, type],
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Author Name</Label>
          <Input
            value={style.authorName}
            onChange={(e) => onChange({ authorName: e.target.value })}
            placeholder="Your Name"
          />
        </div>
        <div className="space-y-1">
          <Label>Author Email</Label>
          <Input
            type="email"
            value={style.authorEmail}
            onChange={(e) => onChange({ authorEmail: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
      </div>
      
      <div className="space-y-1">
        <Label>Branch Name</Label>
        <Input
          value={style.branchName}
          onChange={(e) => onChange({ branchName: e.target.value })}
          placeholder="main"
        />
        <p className="text-[10px] text-muted-foreground mt-1">Target branch for commits in this range</p>
      </div>

      <div className="space-y-2">
        <Label>Commit Message Style</Label>
        <div className="grid grid-cols-2 gap-2">
          {MESSAGE_STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange({ messageStyle: s.value })}
              className={`p-3 rounded border text-sm text-left space-y-1 transition-colors ${
                style.messageStyle === s.value
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <div className="font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground font-mono">{s.example}</div>
            </button>
          ))}
        </div>
      </div>

      {style.messageStyle === 'conventional' && (
        <div className="space-y-2">
          <Label>Commit Types</Label>
          <div className="flex flex-wrap gap-2">
            {CONV_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => toggleConvType(t)}
                className={`px-3 py-1 rounded text-sm border transition-colors ${
                  (style.conventionalTypes || []).includes(t)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {style.messageStyle === 'custom-list' && (
        <div className="space-y-1">
          <Label>Custom Messages (one per line)</Label>
          <textarea
            className="w-full h-32 p-2 border rounded text-sm font-mono resize-none bg-background"
            value={(style.customMessages || []).join('\n')}
            onChange={(e) => onChange({ customMessages: e.target.value.split('\n').filter(Boolean) })}
            placeholder="fix login bug&#10;add dark mode&#10;update docs"
          />
        </div>
      )}

      <div className="space-y-1">
        <Label>Message Prefix (optional)</Label>
        <Input
          value={style.prefix || ''}
          onChange={(e) => onChange({ prefix: e.target.value })}
          placeholder="e.g. [WIP]"
        />
      </div>
    </div>
  );
}

export function StepCommitStyle() {
  const { config, updateGlobalConfig, updateRange } = useGeneratorStore();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Commit Style</h2>
          <p className="text-sm text-muted-foreground">Configure repo name and range-specific author/branch details</p>
        </div>
        <div className="space-y-1">
          <Label>Repo/Folder Name</Label>
          <Input
            value={config.repoName}
            onChange={(e) => updateGlobalConfig({ repoName: e.target.value })}
            placeholder="my-project"
          />
        </div>
      </div>

      <ProfileAccordion
        title="Style"
        renderRange={(range) => (
          <StyleEditor 
            style={range.style} 
            onChange={(partial) => updateRange(range.id, { 
              style: { ...range.style, ...partial } 
            })} 
          />
        )}
      />
    </div>
  );
}
