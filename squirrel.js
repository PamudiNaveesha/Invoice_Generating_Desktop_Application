const { app } = require('electron');
const path = require('path');
const spawn = require('child_process').spawn;

const run = (args, done) => {
  const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
  spawn(updateExe, args, {
    detached: true
  }).on('close', done);
};

const handleSquirrelEvent = () => {
  if (process.argv.length === 1) {
    return false;
  }

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Create shortcuts in the Start Menu
      run(['--createShortcut', app.getName()], app.quit);
      return true;

    case '--squirrel-uninstall':
      // Remove shortcuts from the Start Menu
      run(['--removeShortcut', app.getName()], app.quit);
      return true;

    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
};

if (handleSquirrelEvent()) {
  app.quit();
}
