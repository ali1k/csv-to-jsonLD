const csv = require('csv-streamify')
const fs = require('fs')
const camelCase = require('camelcase');
var validUrl = require('valid-url');
var prefixes = require('./data/prefixes');

let contextObj = {
    "r": "http://rdf.ld-r.org/res/",
    "v": "http://rdf.ld-r.org/vocab/",
    "xsd": "http://www.w3.org/2001/XMLSchema#"
}
let contextOptions ={
  'idColumn': 'ID',
  'entityType': 'Paper',
  'skippedColumns': ['v'],
  'customMappings': {
    'WebURL': 'foaf:page'
  }
}

//automatically add other prefixes from the list
if(contextOptions.customMappings){
  for(let item in contextOptions.customMappings){
    let tmp = contextOptions.customMappings[item].split(':');
    if(prefixes.list[tmp[0]]){
      contextObj[tmp[0]] = prefixes.list[tmp[0]];
    }
  }
}

let graphArr = [];


const options = {
  delimiter: ',', // comma, semicolon, whatever
  newline: '\n', // newline character (use \r\n for CRLF files)
  quote: '"', // what's considered a quote
  empty: 'NA', // empty fields are replaced by this,

  // if true, emit arrays instead of stringified arrays or buffers
  objectMode: false,

  // if set to true, uses first row as keys -> [ { column1: value1, column2: value2 }, ...]
  columns: true
}
const parser = csv(options, function (err, result) {
  if (err) throw err
  // our csv has been parsed succesfully
  //check the first result for context
  if(result.length){
    for(let prop in result[0]){
      if (validUrl.isUri(result[0][prop]) && contextOptions['skippedColumns'].indexOf(prop) == -1){
        if(contextOptions['customMappings'] && contextOptions['customMappings'][prop]){
          contextObj[contextOptions['customMappings'][prop]] = {
            "@type": "@id"
          };
        }else{
          contextObj['v:'+camelCase(prop)] = {
            "@type": "@id"
          };
        }

      }
    }
  }
  result.forEach(function (line) {
    //console.log(line);
    let tmpObj = {};
    tmpObj['@type'] = 'v:'+contextOptions['entityType'];
    for(let prop in line){
      //console.log(line[prop]);
      if(prop == contextOptions['idColumn']){
        tmpObj['@id'] = 'r:'+camelCase(line[prop]);
      }else{
        if(contextOptions['skippedColumns'].indexOf(prop) == -1){
          if(contextOptions['customMappings'] && contextOptions['customMappings'][prop]){
            tmpObj[contextOptions['customMappings'][prop]] = isNaN(line[prop]) ? line[prop] : Number(line[prop]) ;
          }else{
            tmpObj['v:'+camelCase(prop)] = isNaN(line[prop]) ? line[prop] : Number(line[prop]) ;
          }
        }
      }
    }
    graphArr.push(tmpObj);
  });
  let jsonLD = {
     "@context": contextObj,
     "@graph": graphArr
  };
  console.log(JSON.stringify(jsonLD));

})

// now pipe some data into it
fs.createReadStream('csv/example.csv').pipe(parser)
