#!/usr/bin/env node
import fs from 'node:fs'
import { spawnSync } from 'child_process'
import { createInterface } from 'readline'
import { license, licenses } from './license.js'

const { stdin, stdout, stderr } = process
const rl = stderr.isTTY ? createInterface({ input: stdin, output: stderr }) : null

const fullname = spawnSync('git', ['config', 'user.name'], {
                   cwd: process.cwd(), encoding: 'utf8'
                 }).output[1].trim() || '[fullname]'

const key = process.argv[2]

const done = async (key) => {
  const text = await license(key, { fullname }).catch(() => void 0)
  if (text) {
    let b
    if (rl) {
      b = await new Promise(r => rl.question('Save it to LICENSE.txt? (Y/n) ', r))
      rl.close()
    }
    if (!b || b.toLowerCase().startsWith('y')) {
      fs.writeFileSync('LICENSE.txt', text)
      console.error('Done.')
    } else {
      stdout.write(text)
    }
  } else {
    console.error('Not found a license with key =', key)
  }
}

if (key) {
  await done(key)
} else if (!rl) {
  console.error('Usage: license <key>')
} else {
  const data = await licenses()
  for (let i = 0; i < data.length; ++i) {
    console.error(`${i + 1}.`.padStart(4), data[i].name)
  }
  const i = await new Promise(r => rl.question('Choose a license: ', r))
  const a = data[parseInt(i) - 1]
  if (!a) {
    console.error('Not a valid index')
    rl.close()
  } else {
    await done(a.key)
  }
}
