"use strict"

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const folderSrc = path.resolve(__dirname, '../web');
const folderDst = path.resolve(__dirname, '../build');

const fastCompression = false;



clearFolder(folderDst);

scanFolder(folderSrc, folderDst);

function clearFolder(folder) {
	child_process.spawnSync('rm', ['-rf', folder]);
	fs.mkdirSync(folder);
}

function scanFolder(src, dst) {
	// this function is run recursively

	fs.readdirSync(src).forEach(entry => {
		// check every entry in the src folder

		var filenameSrc = path.resolve(src, entry);
		var filenameDst = path.resolve(dst, entry);

		if (fs.statSync(filenameSrc).isDirectory()) {
			// entry is a directory
			scanFolder(filenameSrc, filenameDst);
		} else {
			// entry is a file
			var ext = filenameSrc.split('.').pop();
			switch (ext) {
				// ignored files
				case 'DS_Store':
					return;
				break;

				// copy + compressed
				case 'bin':
				case 'css':
				case 'eot':
				case 'glsl':
				case 'html':
				case 'jpg':
				case 'js':
				case 'json':
				case 'map':
				case 'png':
				case 'svg':
				case 'woff':
				case 'woff2':
					console.log('copy + compress: '+path.relative(folderSrc, filenameSrc));
					ensureFolder(dst);
					copyFile(filenameSrc, filenameDst);
					compressFile(filenameDst);
				break;

				default: throw new Error('Unknown file extension "'+ext+'"');
			}
		}
	})
}

function copyFile(src, dst) {
	fs.writeFileSync(dst, fs.readFileSync(src));
}

function compressFile(filename) {
	if (fastCompression) {
		child_process.spawnSync('gzip', ['-k', filename]);
	} else {
		child_process.spawnSync('zopfli', ['--gzip', '--i15', filename]);
	}
}

function ensureFolder(folder) {
	if (fs.existsSync(folder)) return;
	ensureFolder(path.dirname(folder));
	fs.mkdirSync(folder);
}
