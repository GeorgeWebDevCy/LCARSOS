/**
 * LCARS launcher — ensures ELECTRON_RUN_AS_NODE is cleared so
 * that VS Code's integrated terminal doesn't suppress the Electron API.
 */
const { spawn } = require('child_process');
const path = require('path');

const electronBin = require('electron');
const env = Object.assign({}, process.env);
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBin, [path.resolve(__dirname)], {
  stdio: 'inherit',
  windowsHide: false,
  env
});

child.on('close', code => process.exit(code ?? 0));
