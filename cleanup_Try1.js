const fs = require('fs');
const readline = require('readline');
const JSONObject = require('json-object');

// Parse command line arguments to get filename, and extension
let file_in = process.argv[2];
let file_out = process.argv[3];
let filename = file_in.split('.');
let file_ext = filename.pop();
filename = filename.join();
if (file_out == undefined) {
  file_out = filename + '_converted.' + file_ext;
}

let bookmarks = new JSONObject(`{"unfiled": [], "folders": []}`);
let folders = [];
let folder_current = bookmarks.folders;
let folder_level = 0;
let line_count = 0;

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

const fileStream = fs.createReadStream(file_in);

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});
// Note: we use the crlfDelay option to recognize all instances of CR LF
// ('\r\n') in input.txt as a single line break.

rl.on('line', (line) => {
  line_count++;
  if (line.match(nsbm_tkn_folder)) {
    let folder = line.match(nsbm_folder_name);
    folder_current.push(JSON.parse(`{"name": "${folder}", "contents": []}`));
    
    folder_current = folder_current[0].contents;
    // folder_current = folder_current[folder];
    // folder_current = folder_current;
    console.log(folder_current);
    // console.log(line_count + " Folder opened at level " + folder_level);
    folder_level++;
  }
  if (line.match(nsbm_a)) {
    if(folder_level == 0){
      bookmarks.unfiled.push(JSON.parse(`{"a": "${line.match(re_inner_a)}", "href": "${line.match(re_href)}"}`));
    }
    else {
      folder_current.push(JSON.parse(`{"a": "${line.match(re_inner_a)}", "href": "${line.match(re_href)}"}`));
    }
  }
  if (line.match(nsbm_tkn_close)) {
    // if( nsbm_tkn_close.exec(line) ) {


    // console.log(line_count + " Folder closed at level " + folder_level);
    folder_level--;
  }
});
rl.on('close', () => {
  // console.log("folder_level = " + folder_level);
  // console.log("line_count = " + line_count);
  // console.log(getFolderPath(folders));
  
  console.log("\nBOOKMARKS\n- - - - - - - ");
  console.log(bookmarks);
});

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