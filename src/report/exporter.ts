import fs from 'fs';
import path from 'path';
import os from 'os';
import { Config } from '../config/types';
import { Report } from './generator';

function resolveOutputDir(config: Config): string {
  const dir = config.output.dir.replace(/^~/, os.homedir());
  return path.resolve(dir);
}

export function exportReport(report: Report, config: Config): string {
  const outputDir = resolveOutputDir(config);
  fs.mkdirSync(outputDir, { recursive: true });

  const filename = `${report.date}-${report.repoName}.md`;
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, report.content, 'utf8');

  return filePath;
}

export function getLastReportPath(config: Config, targetDate?: string): string | null {
  const outputDir = resolveOutputDir(config);

  if (!fs.existsSync(outputDir)) return null;

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  if (targetDate) {
    const match = files.find((f) => f.startsWith(targetDate));
    return match ? path.join(outputDir, match) : null;
  }

  return path.join(outputDir, files[0]);
}
