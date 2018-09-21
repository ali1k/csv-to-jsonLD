//specify the path to your input CSV
let csvPath = 'csv/example.csv';
//let csvPath = 'csv/example.csv';
const csv = require('fast-csv')
const fs = require('fs')
const camelCase = require('camelcase');
var validUrl = require('valid-url');
var prefixes = require('./data/prefixes');
//---------configurations--------
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
//-----------------------------
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
let stream = fs.createReadStream(csvPath).setEncoding('utf-8');
let options = {
    delimiter: ',',
    headers: true,
    objectMode: true,
    quote: '"',
    escape: '"',
    ignoreEmpty: true
};
let csvStream = csv(options)
    .on("data", function(data){
         counter++;
         //to limi the number of rows returned
         if(counter === 1){
           for(let prop in data){
             if (validUrl.isUri(data[prop]) && contextOptions['skippedColumns'].indexOf(prop) == -1){
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
         let tmpObj = {};
     tmpObj['@type'] = 'v:'+contextOptions['entityType'];
     for(let prop in data){
       //console.log(line[prop]);
       if(prop == contextOptions['idColumn']){
         tmpObj['@id'] = 'r:'+camelCase(data[prop]);
       }else{
         if(contextOptions['skippedColumns'].indexOf(prop) == -1){
           if(contextOptions['customMappings'] && contextOptions['customMappings'][prop]){
             tmpObj[contextOptions['customMappings'][prop]] = isNaN(data[prop]) ? data[prop] : Number(data[prop]) ;
           }else{
             tmpObj['v:'+camelCase(prop)] = isNaN(data[prop]) ? data[prop] : Number(data[prop]) ;
           }
         }
       }
     }
     graphArr.push(tmpObj);

    })
    .on('data-invalid', function(data){
          //do something with invalid row

      })
      .on('error', function(data){
          //do something with invalid row

      })
    .on("end", function(){
        let jsonLD = {
           "@context": contextObj,
           "@graph": graphArr
        };
        console.log(JSON.stringify(jsonLD));
    });
let counter = 0;
stream.pipe(csvStream);
