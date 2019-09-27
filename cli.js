'use strict'
const meow = require('meow')
const chalk = require('chalk')
const columnify = require('columnify')
const fs = require('fs')
const _ = require('lodash')
const nowConfig = require('./now.json')

const help = `
  Usage
    $ cli <command> [...]
  Commands
    add <server path> <URL>  add a new redirect to a URL
    remove <server path>     remove a redirect
    list                     list all current redirects
`
const cli = meow({help})

const commands = {
  add (path, url) {
    if (!path || !url) {
      console.log(chalk.red('you need both a path and a url eg `cli add /twitter https://twitter.com`'))
      process.exit(1)
    }
    if (path.charAt(0) !== '/') {
      path = '/' + path
    }
    nowConfig.routes.push({ "src": path, "status": 301, "headers": { "Location": url }});
    nowConfig.routes.sort((a, b) => {
      if (a.src < b.src) {
        return -1;
      }
      if (a.src > b.src) {
        return 1;
      }
      return 0;
    });
    const json = JSON.stringify(nowConfig, null, 2);
    fs.writeFileSync('now.json', json);
    console.log(chalk.green(`added redirect from ${path} to ${url}`))
  },
  remove (path) {
    if (!path) {
      console.log(chalk.red('you need a path to remove eg `cli remove /twitter`'))
      process.exit(1)
    }
    if (path.charAt(0) !== '/') {
      path = '/' + path
    }
    _.remove(nowConfig.routes, r => r.src === path);
    const json = JSON.stringify(nowConfig, null, 2);
    fs.writeFileSync('now.json', json);
    console.log(chalk.green(`removed redirect for ${path}`))
  },
  list() {
    const redirects = nowConfig.routes.map(r => {
      return {"src": r.src, "dest": r.headers.Location}
    });
    console.log(columnify(redirects))
  }
};

const command = cli.input[0];
if (!command) {
  cli.showHelp()
} else if (commands[command]) {
  commands[command].apply(commands, cli.input.slice(1))
} else {
  console.log(chalk.red(`${command} is not a valid command`))
  process.exit(1)
}