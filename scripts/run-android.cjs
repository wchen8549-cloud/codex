const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const action = process.argv[2];
if (!['prepare', 'apk', 'open', 'doctor'].includes(action)) {
  console.error('Usage: node scripts/run-android.cjs prepare|apk|open|doctor'); process.exit(1);
}
const cliPackage = path.join(root, 'node_modules/@capacitor/cli/package.json');
if (!fs.existsSync(cliPackage)) { console.error('Capacitor is not installed. Run dependency installation first.'); process.exit(1); }
const manifest = JSON.parse(fs.readFileSync(cliPackage, 'utf8'));
const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin.cap;
const cli = path.resolve(path.dirname(cliPackage), bin);
const taskEnv = { ...process.env };
const pathKey = Object.keys(taskEnv).find(key => key.toLowerCase() === 'path') ?? 'PATH';
taskEnv[pathKey] = path.dirname(process.execPath) + path.delimiter + (taskEnv[pathKey] ?? '');
const localConfigPath = path.join(root, 'android-build.local.json');
let localConfig = {};
if (fs.existsSync(localConfigPath)) {
  try { localConfig = JSON.parse(fs.readFileSync(localConfigPath, 'utf8')); }
  catch { console.error('Invalid android-build.local.json; check the JSON syntax.'); process.exit(1); }
}
const javaBinary = process.platform === 'win32' ? 'java.exe' : 'java';
const javaCandidates = [taskEnv.JAVA_HOME, localConfig.javaHome,
  'C:/Program Files/Android/Android Studio/jbr',
  path.join(taskEnv.USERPROFILE ?? '', 'AppData/Local/Programs/Android Studio/jbr')];
const sdkCandidates = [taskEnv.ANDROID_HOME, taskEnv.ANDROID_SDK_ROOT, localConfig.androidHome,
  path.join(taskEnv.USERPROFILE ?? '', 'AppData/Local/Android/Sdk'),
  path.join(taskEnv.LOCALAPPDATA ?? '', 'Android/Sdk')];
taskEnv.JAVA_HOME = javaCandidates.find(value => typeof value === 'string' && fs.existsSync(path.join(value, 'bin', javaBinary)));
taskEnv.ANDROID_HOME = sdkCandidates.find(value => typeof value === 'string' && fs.existsSync(path.join(value, 'platforms')) && fs.existsSync(path.join(value, 'build-tools')));
if (taskEnv.JAVA_HOME) taskEnv[pathKey] = path.join(taskEnv.JAVA_HOME, 'bin') + path.delimiter + taskEnv[pathKey];
if (taskEnv.ANDROID_HOME) taskEnv.ANDROID_SDK_ROOT = taskEnv.ANDROID_HOME;
let javaMajor = null;
if (taskEnv.JAVA_HOME) {
  const version = spawnSync(path.join(taskEnv.JAVA_HOME, 'bin', javaBinary), ['-version'], { env: taskEnv, encoding: 'utf8' });
  const match = `${version.stdout ?? ''}\n${version.stderr ?? ''}`.match(/version\s+"(\d+)/);
  javaMajor = match ? Number(match[1]) : null;
}
const sdk36Ready = !!taskEnv.ANDROID_HOME && fs.existsSync(path.join(taskEnv.ANDROID_HOME, 'platforms/android-36/android.jar'));
const compatibleJava = javaMajor !== null && javaMajor >= 21 && javaMajor <= 24;
if (action === 'doctor') {
  console.log(`JAVA_HOME: ${taskEnv.JAVA_HOME ?? 'NOT FOUND'}`);
  console.log(`ANDROID_HOME: ${taskEnv.ANDROID_HOME ?? 'NOT FOUND'}`);
  console.log(`Java major: ${javaMajor ?? 'UNKNOWN'}; Gradle 8.14 compatibility: ${compatibleJava ? 'OK' : 'use JDK 21'}`);
  console.log(`Required Android API 36: ${sdk36Ready ? 'OK' : 'NOT INSTALLED'}`);
  if (taskEnv.ANDROID_HOME) {
    console.log(`SDK platforms: ${fs.readdirSync(path.join(taskEnv.ANDROID_HOME, 'platforms')).join(', ')}`);
    console.log(`Build tools: ${fs.readdirSync(path.join(taskEnv.ANDROID_HOME, 'build-tools')).join(', ')}`);
  }
  if (!taskEnv.JAVA_HOME || !taskEnv.ANDROID_HOME || !compatibleJava || !sdk36Ready) process.exit(1);
  const check = spawnSync(path.join(taskEnv.JAVA_HOME, 'bin', javaBinary), ['-version'], { env: taskEnv, stdio: 'inherit' });
  process.exit(check.status ?? 1);
}
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, env: taskEnv, stdio: 'inherit' });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (action === 'apk' && (!taskEnv.JAVA_HOME || !taskEnv.ANDROID_HOME)) {
  console.error(`Android build tools not found. JAVA_HOME=${taskEnv.JAVA_HOME ?? 'NOT FOUND'}; ANDROID_HOME=${taskEnv.ANDROID_HOME ?? 'NOT FOUND'}. Set javaHome/androidHome in android-build.local.json or configure environment variables.`); process.exit(1);
}
if (action === 'apk' && (!compatibleJava || !sdk36Ready)) {
  if (!compatibleJava) console.error(`Java ${javaMajor ?? 'unknown'} cannot build this Gradle 8.14 project. Install JDK 21 and set JAVA_HOME to its root.`);
  if (!sdk36Ready) console.error('Android SDK Platform 36 is missing. Install Android 16 / API 36 in Android Studio SDK Manager.');
  process.exit(1);
}
if (action !== 'open') {
  run(process.execPath, [path.join(root, 'scripts/run-project.cjs'), 'build-android']);
  if (!fs.existsSync(path.join(root, 'android'))) run(process.execPath, [cli, 'add', 'android']);
  run(process.execPath, [cli, 'sync', 'android']);
}
if (action === 'open') { run(process.execPath, [cli, 'open', 'android']); process.exit(0); }
if (action === 'apk') {
  const android = path.join(root, 'android');
  if (process.platform === 'win32') run('cmd.exe', ['/d', '/c', 'gradlew.bat assembleDebug --no-daemon'], android);
  else run('bash', [path.join(android, 'gradlew'), 'assembleDebug', '--no-daemon'], android);
  const apk = path.join(android, 'app/build/outputs/apk/debug/app-debug.apk');
  if (!fs.existsSync(apk)) { console.error('Build ended without the expected APK.'); process.exit(1); }
  const output = path.join(root, 'artifacts/47天国考冲刺管理系统-debug.apk');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(apk, output);
  console.log(`APK created: ${output}`);
}
