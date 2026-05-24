import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const PLIST_LABEL = 'com.work-summary';
const PLIST_PATH = path.join(os.homedir(), 'Library', 'LaunchAgents', `${PLIST_LABEL}.plist`);

interface ScheduleOptions {
  time: string;
  remove?: boolean;
}

function resolveBinaryPath(): string {
  try {
    return execSync('which work-summary', { encoding: 'utf8' }).trim();
  } catch {
    // Fall back to the running Node binary path companion
    return path.join(path.dirname(process.execPath), 'work-summary');
  }
}

function buildPlist(binaryPath: string, hour: number, minute: number): string {
  const logDir = path.join(os.homedir(), '.work-summary', 'logs');
  fs.mkdirSync(logDir, { recursive: true });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>${binaryPath}</string>
    <string>run</string>
    <string>--no-edit</string>
  </array>

  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>${hour}</integer>
    <key>Minute</key>
    <integer>${minute}</integer>
  </dict>

  <key>StandardOutPath</key>
  <string>${path.join(logDir, 'work-summary.log')}</string>

  <key>StandardErrorPath</key>
  <string>${path.join(logDir, 'work-summary-error.log')}</string>

  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>`;
}

function buildCrontabLine(binaryPath: string, hour: number, minute: number): string {
  return `${minute} ${hour} * * * ${binaryPath} run --no-edit >> ~/.work-summary/logs/work-summary.log 2>&1`;
}

export function scheduleCommand(options: ScheduleOptions): void {
  const platform = process.platform;

  if (options.remove) {
    if (platform === 'darwin') {
      if (fs.existsSync(PLIST_PATH)) {
        try {
          execSync(`launchctl unload "${PLIST_PATH}"`, { stdio: 'pipe' });
        } catch {
          // may not be loaded — that's fine
        }
        fs.unlinkSync(PLIST_PATH);
        console.log(`Removed: ${PLIST_PATH}`);
        console.log('Scheduled job unloaded and deleted.');
      } else {
        console.log('No scheduled job found.');
      }
    } else {
      console.log('To remove the crontab entry, run `crontab -e` and delete the work-summary line.');
    }
    return;
  }

  const timeParts = options.time.split(':');
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1] ?? '0', 10);

  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    console.error(`Invalid time: ${options.time}. Use HH:MM format (e.g. 08:00).`);
    process.exit(1);
  }

  const binaryPath = resolveBinaryPath();

  if (platform === 'darwin') {
    const plistContent = buildPlist(binaryPath, hour, minute);
    fs.mkdirSync(path.dirname(PLIST_PATH), { recursive: true });
    fs.writeFileSync(PLIST_PATH, plistContent, 'utf8');

    console.log(`\nLaunchAgent written to: ${PLIST_PATH}`);
    console.log(`Scheduled: work-summary run --no-edit at ${options.time} every day\n`);
    console.log('To activate, run:');
    console.log(`  launchctl load "${PLIST_PATH}"`);
    console.log('\nTo remove later:');
    console.log('  work-summary schedule --remove');
  } else {
    const crontabLine = buildCrontabLine(binaryPath, hour, minute);
    console.log(`\nAdd this line to your crontab (run \`crontab -e\`):\n`);
    console.log(`  ${crontabLine}\n`);
    console.log('To remove, run `crontab -e` and delete that line.');
  }
}
