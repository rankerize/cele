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
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
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
  let newContent = content;

  // Add font-display to existing className="..."
  newContent = newContent.replace(/<(h[123])([^>]*)className="([^"]*)"/g, (match, tag, before, classNames) => {
    if (!classNames.includes('font-display')) {
      return `<${tag}${before}className="font-display ${classNames}"`;
    }
    return match;
  });

  // Add font-display to existing className={'...'}
  newContent = newContent.replace(/<(h[123])([^>]*)className=\{[`'"]([^`'"]*)[`'"]\}/g, (match, tag, before, classNames) => {
    if (!classNames.includes('font-display')) {
      return `<${tag}${before}className={\`font-display ${classNames}\`}`;
    }
    return match;
  });

  // For tags with no className at all, it's a bit harder because we need to not match tags that already matched above or are closing tags.
  // Actually, we can just replace `<h1 ` and `<h1>` if they don't have className
  const addClassIfMissing = (tag) => {
    // This is a naive approach, might not work if className is multiline. Let's just do a simpler search and replace
  };

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated fonts in ${file}`);
    updatedFiles++;
  }
});

console.log(`Finished font processing. Updated ${updatedFiles} files.`);
