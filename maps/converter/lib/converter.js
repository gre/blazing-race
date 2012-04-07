var Converter = require("../blazingRaceConverter.js").Converter;
var fs = require('fs');

if (process.ARGV.length != 2) {
  console.log("Usage: mapconv <input> <output>");
  return;
}

var input = process.ARGV[0];
var output = process.ARGV[1];

fs.readFile(input, "UTF-8", function (error, code) {
  var conv = new Converter(code);
  conv.convert(function(o){
    console.log(o);
    fs.writeFile(output, JSON.stringify(o));
  });
});
  
