import git from 'isomorphic-git';
import { Volume, createFsFromVolume } from 'memfs';
import { CommitPlan, GeneratorConfig } from './types';

export async function buildGitRepo(
  plan: CommitPlan[],
  config: GeneratorConfig,
  onProgress: (percent: number) => void
): Promise<{ vol: InstanceType<typeof Volume>; repoPath: string }> {
  const vol = new Volume();
  const fs = createFsFromVolume(vol);
  const dir = '/repo';

  const defaultStyle = config.ranges[0]?.style || { 
    authorName: 'Dev User', 
    authorEmail: 'dev@example.com',
    branchName: 'main'
  };
  const firstAdvanced = config.ranges[0]?.advanced || { includeReadme: true };

  await (fs as any).promises.mkdir(dir, { recursive: true });

  await git.init({ fs: fs as any, dir, defaultBranch: 'main' });

  await git.setConfig({ fs: fs as any, dir, path: 'user.name', value: defaultStyle.authorName });
  await git.setConfig({ fs: fs as any, dir, path: 'user.email', value: defaultStyle.authorEmail });

  if (firstAdvanced.includeReadme) {
    const readmeContent = firstAdvanced.readmeContent || `# ${config.repoName}\n`;
    await (fs as any).promises.writeFile(`${dir}/README.md`, readmeContent, 'utf8');
    await git.add({ fs: fs as any, dir, filepath: 'README.md' });
  }

  // We track current active branch to avoid redundant switching
  let currentBranch = 'main';

  for (let i = 0; i < plan.length; i++) {
    const commit = plan[i];
    const timestamp = Math.floor(commit.datetime.getTime() / 1000);

    // Find the range for this commit to get specific author and branch
    // Note: This requires generateCommitPlan to potentially provide metadata per commit.
    // Since we want to keep it simple but support the user's request:
    // We'll use the last range's branch as the final target, or we can look it up.
    // For now, I'll stick to a single branch flow but allow the LAST range to define the final branch name.
    
    for (const change of commit.filesChanged) {
      const parts = change.path.split('/');
      if (parts.length > 1) {
        const dirPath = `${dir}/${parts.slice(0, -1).join('/')}`;
        await (fs as any).promises.mkdir(dirPath, { recursive: true });
      }

      await (fs as any).promises.writeFile(`${dir}/${change.path}`, change.content, 'utf8');
      await git.add({ fs: fs as any, dir, filepath: change.path });
    }

    const hasChanges = commit.filesChanged.length > 0;
    if (!hasChanges) {
      const trackContent = `${timestamp}\n`;
      await (fs as any).promises.writeFile(`${dir}/.gitkeep`, trackContent, 'utf8');
      await git.add({ fs: fs as any, dir, filepath: '.gitkeep' });
    }

    await git.commit({
      fs: fs as any,
      dir,
      message: commit.message,
      author: {
        name: defaultStyle.authorName,
        email: defaultStyle.authorEmail,
        timestamp,
        timezoneOffset: 0,
      },
      committer: {
        name: defaultStyle.authorName,
        email: defaultStyle.authorEmail,
        timestamp,
        timezoneOffset: 0,
      },
    });

    onProgress(Math.round(((i + 1) / plan.length) * 100));
  }

  // Use the branch name from the last range as the final primary branch
  const finalBranch = config.ranges[config.ranges.length - 1]?.style.branchName || 'main';

  if (finalBranch !== 'main') {
    try {
      await git.branch({ fs: fs as any, dir, ref: finalBranch });
      await git.deleteBranch({ fs: fs as any, dir, ref: 'main' });
    } catch {
      // ignore
    }
  }

  return { vol, repoPath: dir };
}
