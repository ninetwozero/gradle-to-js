'use strict';
var stream = require("stream");
var Promise = require("bluebird");

var exports = module.exports = {};

var CHAR_NEWLINE = 10;
var CHAR_SPACE = 32; 
var CHAR_BACKSLASH = 92;
var CHAR_BLOCK_START = 123;
var CHAR_BLOCK_END = 125;

function parse(readableStream) {
    return new Promise(function(resolve, reject) {
        var out = {};
        readableStream.on('data', function(chunk) {
            var chunkLength = chunk.length;
            var character = "";
            var tempString = "";
          
            var currentKey = "";
            var isParsingKey = true;
            var isParsingBlock = false;

            console.log(chunk)
            for (var i = 0; i < chunkLength; i++) {
                character = chunk[i];

                if (character == CHAR_NEWLINE) {
                    if (currentKey && tempString) {
                        // Remove any leading/trailing quotes (single + double)
                        out[currentKey] = tempString.replace(/(^["']|["']$)/g, '');
                    }
                    currentKey = "";
                    tempString = "";
                    isParsingKey = true;
                    continue;
                }

                if (character == CHAR_BLOCK_START) {
                    console.log("Found a new block");
                    if (!currentKey && isParsingKey) {
                        currentKey = tempString;
                        isParsingKey = false;
                    }
                    out[currentKey] = {};
                    tempString = "";

                    isParsingBlock = true;
                } else if (character == CHAR_BLOCK_END) {
                    console.log("Found the end of the block");
                    currentKey = "";
                    tempString = "";

                    isParsingKey = true;
                    isParsingBlock = false;
                } else if (character == CHAR_SPACE && isParsingKey) {
                    currentKey = tempString;

                    tempString = "";
                    isParsingKey = false;
                } else {
                    tempString += String.fromCharCode(character)
                }
                // TODO: Parse a given stream using our really wicked rules
            }
            if (currentKey) {
                // Remove any leading/trailing quotes (single + double)
                out[currentKey] = tempString.replace(/(^["']|["']$)/g, '');
            }
        });

        readableStream.on('end', function() {
            console.log("Returning <<", out, ">>")
            resolve(out);
        });
        readableStream.on('error', function() {
            reject('Error parsing stream');
        });
    });
}

function parseText(text) {
    var textAsStream = new stream.Readable();
    textAsStream._read = function noop() {};
    textAsStream.push(text);
    textAsStream.push(null);
    return parse(textAsStream);
}

function parseFile(path) {
    // TODO: Parse a given <<path>> as a file
    // fs.createReadStream(path); // Check for existing file
    return "parseFile not implemented";
}

function parseUrl(url) {
    // TODO: Parse a given <<url>> using requests
    return "parseUrl not implemented";
}

module.exports = {
    parseText: parseText,
    parseFile: parseFile,
    parseUrl: parseUrl
};
