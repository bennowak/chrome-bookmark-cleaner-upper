const fs = require('fs');
const readline = require('readline');

// Parse command line arguments to get filename, and extension
let file_in = process.argv[2];
let file_out = process.argv[3];
let filename = file_in.split('.');
let file_ext = filename.pop();
filename = filename.join();
if (file_out == undefined) {
  file_out = filename + '_converted.' + file_ext;
}

// Prep file for parsing
const fileStream = fs.createReadStream(file_in);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

//  RegEx's for parsing constants
//  Sentinel tokens
const nsbm_tkn_folder = /<DT><H3/ig;
const nsbm_tkn_open = /<DL><P>/ig;
const nsbm_tkn_close = /<\/DL><P>/ig;
//  Data extractors
const re_href = /(?<=HREF=")([^\'\"]+)/ig;
const re_inner_a = /(?<=">).*(?=<\/['A'|'a']>)/ig;
const nsbm_folder_name = /(?<=<DT><H3.*)(?<=">).*(?=<\/H3>)/ig;
const nsbm_a = /<DT><A/ig;
//  Variables for saving structure
let bookmarks = [];
let index_stack = [];
let current_folder;
let current_index = 0;
let folder_level = 0;
let line_count = 0;

rl.on('line', (line) => {
  console.log(bookmarks);
  console.log(index_stack);
  line_count++;
  if (line.match(nsbm_tkn_folder)) {
    let folder = line.match(nsbm_folder_name);
    if(folder_level == 0){
      bookmarks.push([`${folder}`]);
      index_stack.push(current_index);
    }
    if(folder_level == 1){
      bookmarks[index_stack[0]].push([`${folder}`]);
      index_stack.push(current_index);
    }
    if(folder_level == 2){
      bookmarks[index_stack[0]][index_stack[1]].push([`${folder}`]);
      index_stack.push(current_index);
    }
    current_index=1;
    folder_level++;
  }
  if (line.match(nsbm_a)) {
    let a = line.match(re_inner_a);
    let href = line.match(re_href);
    if(folder_level == 0){
      bookmarks.push(jsonToA(a, href));
    }
    if(folder_level == 1){
      bookmarks[index_stack[0]].push(jsonToA(a, href));
    }
    if(folder_level == 2){
      bookmarks[index_stack[0]][index_stack[1]].push(jsonToA(a, href));
    }
    current_index++;
  }
  if (line.match(nsbm_tkn_close)) {
    // current_index = index_stack.pop();
    folder_level--;
    current_index = index_stack[index_stack.pop()];
  }
});
rl.on('close', () => {
  console.log("folder_level = " + folder_level);
  console.log("line_count = " + line_count);
  console.log(bookmarks);

});

function jsonToA(a, href){
  return JSON.parse(`{"a": "${a}", "href": "${href}"}`);
}

function getFolderPath(folders) {
  let str = "";
  for (let i in folders) {
    switch (i) {
      case '0':
        str += folders[i];
        break;
      default:
        str += ` -> ${folders[i]}`;
        break;
    }
  }
  return str;
}