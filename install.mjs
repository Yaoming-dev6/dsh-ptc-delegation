#!/usr/bin/env node
/**
 * dsh-ptc-delegation installer.
 *
 * Appends the "PTC 委派模式" preset (ptc-workflow) to a DSH profile's
 * cordis.patch.yml, keeping a backup and using markers for easy removal.
 *
 * Usage:
 *   node install.mjs                 install into every DSH profile
 *   node install.mjs --dry-run       preview, write nothing
 *   node install.mjs --verify        report installation state
 *   node install.mjs --remove        remove the block from every profile
 *   node install.mjs --profile NAME  only one profile
 *   node install.mjs --file PATH     only one cordis.patch.yml
 */
import {
  readFileSync,
  writeFileSync,
  existsSync,
  copyFileSync,
  readdirSync,
} from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PRESET_FILE = join(HERE, 'cordis.patch.yml')
const PKG = JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8'))
const START = '# >>> dsh-ptc-delegation: PTC 委派模式 (ptc-workflow) >>>'
const END = '# <<< dsh-ptc-delegation <<<'
const PRESET_ID = 'preset-ptc-workflow'

const opts = { dryRun: false, remove: false, verify: false, profile: null, file: null }

function die(msg) {
  console.error('错误: ' + msg)
  process.exit(1)
}

function usage() {
  console.log(`用法: node install.mjs [选项]

  --dry-run, -n        只预览，不写文件
  --verify, -v         检查安装状态
  --remove, -r         卸载（删除追加的预设块）
  --profile <name>     只处理一个 profile（默认所有 profile）
  --file <path>        只处理一个 cordis.patch.yml
  --version, -V        显示版本
  --help, -h           显示帮助
`)
}

for (let i = 0; i < process.argv.length - 2; i++) {
  const a = process.argv[i + 2]
  if (a === '--dry-run' || a === '-n') opts.dryRun = true
  else if (a === '--remove' || a === '-r') opts.remove = true
  else if (a === '--verify' || a === '-v') opts.verify = true
  else if (a === '--profile' || a === '-p') { opts.profile = process.argv[++i + 2]; if (!opts.profile) die('--profile 需要一个参数') }
  else if (a === '--file' || a === '-f') { opts.file = process.argv[++i + 2]; if (!opts.file) die('--file 需要一个参数') }
  else if (a === '--version' || a === '-V') { console.log(PKG.name + ' ' + PKG.version); process.exit(0) }
  else if (a === '--help' || a === '-h') { usage(); process.exit(0) }
  else die('未知参数: ' + a + '（--help 查看用法）')
}

if (!existsSync(PRESET_FILE)) die('找不到预设文件: ' + PRESET_FILE)

const block = readFileSync(PRESET_FILE, 'utf8')
  .replace(/^\uFEFF/, '')
  .replace(/\r\n/g, '\n')
  .replace(/\s+$/, '')
const section = START + '\n' + block + '\n' + END

function timestamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds())
}

function targets() {
  if (opts.file) return [resolve(opts.file)]
  const root = join(homedir(), '.dsh', 'profiles')
  if (!existsSync(root)) die('找不到 DSH profile 目录: ' + root)
  const names = opts.profile
    ? [opts.profile]
    : readdirSync(root).filter((n) => existsSync(join(root, n, 'cordis.patch.yml')))
  if (!names.length) die('没有找到任何 cordis.patch.yml，先确认 DSH 已运行过')
  return names.map((n) => join(root, n, 'cordis.patch.yml'))
}

function analyze(text) {
  return {
    hasPreset: text.includes(PRESET_ID),
    hasMarker: text.includes(START),
  }
}

function installOne(file) {
  if (!existsSync(file)) die('文件不存在: ' + file)
  const text = readFileSync(file, 'utf8')
  const info = analyze(text)
  if (info.hasPreset) {
    console.log('  已安装，跳过: ' + file)
    return 'skipped'
  }
  const trimmed = text.trim()
  if (trimmed && !trimmed.startsWith('[') && !trimmed.startsWith('-') && !trimmed.startsWith('#')) {
    die('目标文件不像 YAML 数组，拒绝修改: ' + file)
  }
  let next
  if (trimmed === '' || trimmed === '[]') next = section + '\n'
  else next = text.replace(/\s+$/, '') + '\n\n' + section + '\n'

  if (opts.dryRun) {
    console.log('  [dry-run] 会修改: ' + file)
    return 'dry'
  }
  const backup = file + '.bak-' + timestamp()
  copyFileSync(file, backup)
  writeFileSync(file, next, 'utf8')
  console.log('  已写入: ' + file)
  console.log('  备份:   ' + backup)
  return 'installed'
}

function removeOne(file) {
  if (!existsSync(file)) die('文件不存在: ' + file)
  const text = readFileSync(file, 'utf8')
  const start = text.indexOf(START)
  const end = text.indexOf(END)
  if (start < 0 || end < start) {
    if (text.includes(PRESET_ID)) {
      console.log('  找到预设但没找到本脚本的标记，请手动删除: ' + file)
      return 'manual'
    }
    console.log('  未安装，跳过: ' + file)
    return 'skipped'
  }
  let next = text.slice(0, start) + text.slice(end + END.length)
  const hadBom = next.startsWith('\uFEFF')
  if (hadBom) next = next.slice(1)
  next = next.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+$/gm, '').replace(/\s+$/, '')
  if (next.trim() === '') next = '[]'
  next = (hadBom ? '\uFEFF' : '') + next + '\n'
  if (opts.dryRun) {
    console.log('  [dry-run] 会删除预设块: ' + file)
    return 'dry'
  }
  const backup = file + '.bak-' + timestamp()
  copyFileSync(file, backup)
  writeFileSync(file, next, 'utf8')
  console.log('  已移除: ' + file)
  console.log('  备份:   ' + backup)
  return 'removed'
}

function verifyOne(file) {
  if (!existsSync(file)) { console.log('  缺失: ' + file); return false }
  const info = analyze(readFileSync(file, 'utf8'))
  console.log('  ' + (info.hasPreset ? '已安装' : '未安装') + (info.hasPreset && !info.hasMarker ? '（无本脚本标记，手动安装）' : '') + ': ' + file)
  return info.hasPreset
}

const files = targets()
console.log('dsh-ptc-delegation\n')

let ok = true
for (const file of files) {
  let r
  if (opts.verify) { if (!verifyOne(file)) ok = false; continue }
  if (opts.remove) r = removeOne(file)
  else r = installOne(file)
  if (r === 'manual') ok = false
}

if (!opts.verify && !opts.dryRun) {
  console.log('\n下一步: 重启 DSH，然后新建会话选择「PTC 委派模式」。')
  console.log('卸载: node install.mjs --remove')
}
process.exit(ok ? 0 : 1)
