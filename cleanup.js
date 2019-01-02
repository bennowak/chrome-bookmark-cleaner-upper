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
let folder_stack = [];
let current_index;
let folder_level = 0;
let line_count = 1;
let isClosed = false;
let matched_token;

rl.on('line', (line) => {
  matched_token = false;
  if (line.match(nsbm_tkn_folder)) {
    matched_token = true;
    if(current_index == null) { current_index = 0;}
    console.log("Folder : ");
    let folder = line.match(nsbm_folder_name);
    
    if(folder_level == 0){
      console.log(`bookmarks.push(jsonToFolder(folder))`);
      console.log(`bookmarks.push(jsonToFolder(${folder}));`);
      bookmarks.push(jsonToFolder(folder));
    }
    if(folder_level == 1){
      console.log(`bookmarks[index_stack[0]][folder_stack[0]].push(jsonToFolder(folder))`);
      console.log(`bookmarks[${index_stack[0]}].push(jsonToFolder(${folder}));`);
      bookmarks[index_stack[0]][folder_stack[0]].push(jsonToFolder(folder));
    }
    if(folder_level == 2){
      console.log(`bookmarks[index_stack[0]][folder_stack[0]][index_stack[1]][folder_stack[1]].push(jsonToFolder(folder))`);
      console.log(`bookmarks[${index_stack[0]}][${folder_stack[0]}][${index_stack[1]}][${folder_stack[1]}].push(jsonToFolder(${folder}));`);
      bookmarks[index_stack[0]][folder_stack[0]][index_stack[1]][folder_stack[1]].push(jsonToFolder(folder));
    }
    index_stack.push(current_index);
    folder_stack.push(folder);
    current_index=0;
    folder_level++;
    isClosed = false;
  }

  if (line.match(nsbm_a)) {
    matched_token = true;
    if(current_index == null) { current_index = 0;}
    console.log("Anchor : ");
    let a = line.match(re_inner_a);
    let href = line.match(re_href);
    if(folder_level == 0){
      console.log(`bookmarks.push(jsonToA(a, href))`);
      console.log(`bookmarks.push(jsonToA(${a}, ${href}))`);
      bookmarks.push(jsonToA(a, href));
    }
    if(folder_level == 1){
      console.log(`bookmarks[index_stack[0]][folder_stack[0]].push(jsonToA(a, href))`);
      console.log(`bookmarks[${index_stack[0]}][${folder_stack[0]}].push(jsonToA(${a}, ${href}));`);
      bookmarks[index_stack[0]][folder_stack[0]].push(jsonToA(a, href));
    }
    if(folder_level == 2){
      console.log(`bookmarks[index_stack[0]][folder_stack[0]][index_stack[1]][folder_stack[1]].push(jsonToA(a, href))`);
      console.log(`bookmarks[${index_stack[0]}][${folder_stack[0]}][${index_stack[1]}][${folder_stack[1]}].push(jsonToA(${a}, ${href}));`);
      bookmarks[index_stack[0]][folder_stack[0]][index_stack[1]][folder_stack[1]].push(jsonToA(a, href));
    }
    if(folder_level == 3){
      // console.log(`bookmarks[${index_stack[0]}][${folder_stack[0]}][${index_stack[1]}][${folder_stack[1]}][${index_stack[2]}][${folder_stack[2]}].push(jsonToA(${a}, ${href}));`);
      // bookmarks[index_stack[0]][folder_stack[0]][index_stack[1]][folder_stack[1]][index_stack[2]][folder_stack[2]].push(jsonToA(a, href));
      console.log("error");
    }
    isClosed = false;
    current_index++;
  }

  if (line.match(nsbm_tkn_close)) {
    matched_token = true;
    console.log("Closing Token : ");
    
    if(isClosed){
      folder_stack.pop();
      index_stack.pop();
    } else {
      folder_level--;
      isClosed = true;
      folder_stack.pop();
      index_stack.pop();
      current_index = index_stack[index_stack.length - 1];
    }
  }

  line_count++;
  if(matched_token) {
    printModVars();
  }
});

rl.on('close', () => {
  console.log("folder_level = " + folder_level);
  console.log("line_count = " + line_count);
  console.log(JSON.stringify(bookmarks));
  console.log(bookmarks);
});

function printModVars(){
  console.log("index_stack = " + index_stack);
  console.log("folder_stack = " + folder_stack);
  console.log("current_index = " + current_index);
  console.log("folder_level = " + folder_level);
  console.log("isClosed = " + isClosed);
  console.log(`--------------------------`);
  console.log(JSON.stringify(bookmarks));
  console.log(bookmarks);
  console.log(`=======================================================================`);
}

function jsonToA(a, href){
  return JSON.parse(`{"a": "${a}", "href": "${href}"}`);
}

function jsonToFolder(folder){
  return JSON.parse(`{"${folder}": []}`);
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