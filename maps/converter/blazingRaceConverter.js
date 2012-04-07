var $ = require("jquery");
var jsdom = require("jsdom");
var fs = require('fs');

/*
self = window = jsdom.createWindow();
THREE = require("./lib/Three.js").THREE;
//console.log(THREE);
require("./lib/ThreeExtras.js");
//console.log(THREE);
*/

var path = require("path");
var lib = path.join(path.dirname(fs.realpathSync(__filename)), './lib');



/*
function parsePosition (text) {
  var p = text.trim().split(/\ +/);
  return {
    x: parseFloat(p[0]),
    y: parseFloat(p[1])
  };
}

function parsePositions (text) {
  var raw = text.trim().split(/\ +/);
  var arr = [];
  for (var i = 0; i < raw.length; i += 3) {
    arr.push({
      x: parseFloat(raw[i]),
      y: parseFloat(raw[i+1])
    });
  }
  return arr;
}

function parseIntArray (text) {
  var raw = text.split(/\ +/);
  var arr = [];
  for (var i = 0; i < raw.length; ++i) {
    if (raw[i]!=='') 
      arr.push(parseInt(raw[i]));
  }
  return arr;
}

function getPolygons ($positions, $polylist) {
  var positions = parsePositions($positions.text());
  var faces = parseIntArray($polylist.find("p").text());
  var vcount = parseIntArray($polylist.find("vcount").text());
  var inputcount = $polylist.find("input");
  var maxoffset = inputcount.map(function(i,node){
    return $(node).attr("offset") || 0;
  }).sort()[inputcount.size()-1] || 0;

  var tris=[];
  var cnt=0;
  for(n=0; n<vcount.length; n++) {
    for(var j=0; j<vcount[n]-2; j++) {
      for(var k=0; k<=maxoffset; k++){
        tris.push(faces[cnt+k]);
      }
      for(k=0; k<=maxoffset; k++){
        tris.push(faces[cnt+(maxoffset+1)*(j+1)+k]);
      }
      for(k=0; k<=maxoffset; k++){
        tris.push(faces[cnt+(maxoffset+1)*(j+2)+k]);
      }
    }
    cnt = cnt+(maxoffset+1)*vcount[n];
  }
  console.log(tris);

}
*/

function Converter (collada) {
  var doc = $(collada);

  var cb;
  var result;

  jsdom.env({
    html: "<html><head></head><body></body></html>",
    src: [
    fs.readFileSync(lib+"/Three.js").toString(),
    fs.readFileSync(lib+"/ThreeExtras.js").toString()
    ],
    done: function(errors, window) {
      var THREE = window.THREE;
      var loader = new THREE.ColladaLoader();
      var obj = loader.parse(collada);
      console.log(obj);
      result = { todo : true };
      cb && cb(result);
    }
  });
  /*
  var objects = doc.find("library_visual_scenes node").map(function (i, n) {
    var node = $(n);
    var ret = {
      id: node.attr("id"),
      position: parsePosition(node.find("translate:first").text())
    };
    var geometryUrl = node.find("instance_geometry").attr("url");
    if (geometryUrl) {
      var geometry = doc.find(geometryUrl);
      var accessor = geometry.find("technique_common accessor").attr("source");
      var $positions = geometry.find(accessor);
      var $polylist = geometry.find("polylist");

      ret.geometry = getPolygons($positions, $polylist);
    }
    return ret;
  }).toArray();
  */

  //var loader = new THREE.ColladaLoader();
  //var obj = loader.parse(collada);
  //console.log(obj);

  this.convert = function (callback) {
    if (result)
      callback(result);
    else
      cb = callback;
  }
}

exports.Converter = Converter;
