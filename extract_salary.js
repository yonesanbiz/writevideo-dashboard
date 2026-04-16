const fs = require('fs');
const content = fs.readFileSync('api/salary-data.js', 'utf8');
const match = content.match(/const SALARY_DATA = ([\s\S]*?);\n\nexport/);
if (match) { process.stdout.write(JSON.stringify(eval('(' + match[1] + ')'))); }
