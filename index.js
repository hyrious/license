#!/usr/bin/env node
const fs = require('fs')
const { request } = require('https')
const cacheFile = require('path').join(require('os').tmpdir(), 'github-licenses.json')

let cache

function httpGet(path, options = {}) {
    if (!cache) {
        if (fs.existsSync(cacheFile)) {
            try {
                cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
            } catch {
                fs.unlinkSync(cacheFile)
            }
        }
        if (typeof cache !== "object") {
            cache = {}
        }
    }
    if (cache[path]) {
        return cache[path]
    }

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': `Node.js ${process.version}`,
    }
    if (options.token) {
        headers['Authorization'] = `token ${options.token}`
    }
    return new Promise((resolve, reject) => {
        const req = request({
            hostname: 'api.github.com',
            path,
            method: 'GET',
            headers,
        }, res => {
            const chunks = []
            res.on('data', chunk => chunks.push(chunk))
            res.on('end', () => {
                const body = JSON.parse(chunks.join(''))
                cache[path] = body
                fs.writeFileSync(cacheFile, JSON.stringify(cache))
                resolve(body)
            })
        })
        req.on('error', reject)
        req.end()
    })
}

function enumerate(array) {
    return array.map((e, i) => [i, e])
}

async function license() {
    const { isTTY } = process.stdout
    if (!isTTY) return

    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const indexes = await httpGet('/licenses')
    for (const [i, { name }] of enumerate(indexes)) {
        console.log(`${i + 1}.`.padStart(4), name)
    }

    rl.question('Choose a license: ', async a => {
        if (!(a = indexes[parseInt(a) - 1])) {
            console.log('not a valid index')
            return rl.close()
        }

        let { body } = await httpGet(`/licenses/${a.key}`)

        body = body.replace(/\[\w+\]/g, match => {
            if (match === '[year]') return new Date().getFullYear()
            if (match === '[fullname]') {
                return require('child_process').spawnSync(
                    'git', ['config' ,'user.name'], {
                        cwd: process.cwd(),
                        env: process.env,
                        stdio: 'pipe',
                        encoding: 'utf-8',
                    }
                ).output[1].trim() || match
            }
            return match
        })

        rl.question('Save it to LICENSE.txt? (Y/n) ', a => {
            rl.close()
            if (!a || a.toLowerCase().startsWith('y')) {
                fs.writeFileSync('LICENSE.txt', body)
                console.log('Done.')
            } else {
                console.log(body)
            }
        })
    })
}

module.exports = license

if (require.main === module) {
    license()
}
