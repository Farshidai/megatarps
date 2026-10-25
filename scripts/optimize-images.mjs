// Converts the large marketing PNGs in public/images to WebP.
//
// Usage: node scripts/optimize-images.mjs [dir=public/images] [--force]
//
// For every *.png in the directory it writes, next to the original:
//   name.webp        full size, capped at MAX_WIDTH  (use this as the next/image src)
//   name-640.webp    small variant (mobile / CSS backgrounds / emails)
//   name-1280.webp   medium variant (only if the source is wider than 1280)
// Originals are left in place. Existing outputs that are newer than their source are
// skipped unless --force is given. sharp ships with Next.js, so no extra dependency.
import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let sharp
try {
  sharp = require('sharp')
} catch {
  console.error('sharp is not resolvable. Run: npm i -D sharp')
  process.exit(1)
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const dir = args.find((a) => !a.startsWith('--')) ?? 'public/images'
const MAX_WIDTH = 1920
const VARIANTS = [640, 1280]
const QUALITY = 78

const kb = (n) => `${(n / 1024).toFixed(0)} KB`
const files = readdirSync(dir).filter((f) => extname(f).toLowerCase() === '.png')
if (!files.length) {
  console.log(`No PNG files in ${dir}`)
  process.exit(0)
}

let before = 0
let after = 0
for (const f of files) {
  const src = join(dir, f)
  const name = basename(f, extname(f))
  const srcStat = statSync(src)
  const meta = await sharp(src).metadata()
  const jobs = [{ out: join(dir, `${name}.webp`), width: Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH) }]
  for (const w of VARIANTS) if ((meta.width ?? 0) > w) jobs.push({ out: join(dir, `${name}-${w}.webp`), width: w })

  for (const { out, width } of jobs) {
    if (!force && existsSync(out) && statSync(out).mtimeMs > srcStat.mtimeMs) continue
    await sharp(src)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
      .toFile(out)
  }
  const main = statSync(jobs[0].out).size
  before += srcStat.size
  after += main
  console.log(
    `${f.padEnd(28)} ${String(meta.width).padStart(4)}×${String(meta.height).padEnd(4)} ${kb(srcStat.size).padStart(8)} → ${kb(main).padStart(7)} (${name}.webp)` +
      (jobs.length > 1 ? ` + ${jobs.slice(1).map((j) => `${j.width}w ${kb(statSync(j.out).size)}`).join(', ')}` : ''),
  )
}
console.log(`\nTotal (full-size WebP vs PNG): ${kb(before)} → ${kb(after)}  (-${(100 - (after / before) * 100).toFixed(1)}%)`)
