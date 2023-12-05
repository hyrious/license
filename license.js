import fs from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const { env } = process

const cacheName = 'github-licenses.json'
const cacheFile =
  process.platform === 'darwin' ? join(homedir(), 'Library', 'Caches', cacheName) :
  process.platform === 'win32'  ? join(env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local', 'Cache'), cacheName) :
                                  join(env.XDG_CACHE_HOME || join(homedir(), '.cache'), cacheName)

let cache = {}
if (fs.existsSync(cacheFile)) {
  try { cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) }
  catch { }
  cache ||= {}
}

async function GET(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': `Node.js ${process.version}`,
      'X-GitHub-Api-Version': '2022-11-28',
    }
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  const data = await res.json()
  cache[path] = data
  fs.mkdirSync(dirname(cacheFile), { recursive: true })
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2))
  return data
}

export function licenses() {
  return GET('/licenses')
}

export async function license(key, replacement = {}) {
  replacement['year'] ||= new Date().getFullYear()
  const { body } = await GET(`/licenses/${key}`)
  return body.replace(/\[\w+\]/g, match => {
    const key = match.slice(1, -1)
    return replacement[key] || match
  })
}
