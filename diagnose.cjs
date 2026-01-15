const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const startMarker = 'function switchView';
const startIndex = content.indexOf(startMarker);

if (startIndex === -1) {
    console.error('Could not find switchView script block');
    process.exit(1);
}

const scriptStart = content.lastIndexOf('<script>', startIndex);
const scriptEnd = content.indexOf('</script>', startIndex);

if (scriptStart === -1 || scriptEnd === -1) {
    console.error('Could not isolate script block');
    process.exit(1);
}

const jsContent = content.substring(scriptStart + 8, scriptEnd);
fs.writeFileSync('temp_debug.js', jsContent);
console.log('Extracted script to temp_debug.js');
