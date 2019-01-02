const fs = require('fs');
const readline = require('readline');

// Parse command line arguments to get filename, and extension
let file_in = process.argv[2];

async function processLineByLine(file) {
  let links = [];
  const fileStream = fs.createReadStream(file);
  const re_href = /(?<=HREF=")([^\'\"]+)/ig
  const re_inner_a = new RegExp(`(?<=">).*(?=</['A'|'a']>)`);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    if(line.match(re_inner_a) !== null){
      links.push(`{"href": "${line.match(re_href)}", "a": "${line.match(re_inner_a)}"}`);
    }
  }
  console.log(links);
}

processLineByLine(file_in);