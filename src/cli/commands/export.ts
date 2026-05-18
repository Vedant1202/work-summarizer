import { loadConfig } from '../../config/loader';
import { getLastReportPath } from '../../report/exporter';
import { openInEditor } from '../review';
import fs from 'fs';

interface ExportOptions {
  date?: string;
  open?: boolean;
}

export async function exportCommand(options: ExportOptions): Promise<void> {
  const config = loadConfig();
  const reportPath = getLastReportPath(config, options.date);

  if (!reportPath) {
    const hint = options.date ? `for date ${options.date}` : 'yet';
    console.error(`No report found ${hint}. Run \`daily-summary run\` first.`);
    process.exit(1);
  }

  if (options.open) {
    const content = fs.readFileSync(reportPath, 'utf8');
    await openInEditor(content);
    return;
  }

  console.log(reportPath);
}
