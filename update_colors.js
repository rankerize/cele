const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [...walk('./components'), ...walk('./app')];

let updatedFiles = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(/\b(text|bg|border|ring|fill|stroke|from|to|via)-blue-(\d{2,3})\b/g, '$1-brand-$2');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
    updatedFiles++;
  }
});

console.log(`Finished processing. Updated ${updatedFiles} files.`);
