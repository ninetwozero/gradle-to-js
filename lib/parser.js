'use strict';
var stream = require("stream");
var Promise = require("bluebird");

var exports = module.exports = {};

var CHAR_NEWLINE = 10;
var CHAR_SPACE = 32; 
var CHAR_BACKSLASH = 92;
var CHAR_BLOCK_START = 123;
var CHAR_BLOCK_END = 125;

var WHITESPACE_CHARACTERS = {};
WHITESPACE_CHARACTERS[CHAR_NEWLINE] = true;
WHITESPACE_CHARACTERS[CHAR_SPACE] = true;

// TODO: Parse a given stream using our really wicked rules
function deepParse(chunk, count) {
    var out = {};

    var chunkLength = chunk.length;
    var character = "";
    var tempString = "";
    
    var currentKey = "";
    var isParsingKey = true;
    var isBeginningOfLine = true;

    for (; count.index < chunkLength; count.index++) {
        character = chunk[count.index];

        if (isBeginningOfLine && isWhitespace(character)) {
            continue;
        }

        if (character == CHAR_NEWLINE) {
            if (currentKey && tempString) {
                out[currentKey] = trimQuotes(tempString);
            }
            currentKey = "";
            tempString = "";
            isParsingKey = true;
            isBeginningOfLine = true;
            continue;
        }

        if (character == CHAR_BLOCK_START) {
            count.index++; // We need to skip the start character
            out[currentKey] = deepParse(chunk, count);
            currentKey = "";
        } else if (character == CHAR_BLOCK_END) {
            currentKey = "";
            tempString = "";

            break;
        } else if (character == CHAR_SPACE && isParsingKey) {
            currentKey = tempString;
            tempString = "";
            isParsingKey = false;
        } else {
            isBeginningOfLine = false;
            tempString += String.fromCharCode(character)
        }
    }
    if (currentKey && tempString) {
        out[currentKey] = trimQuotes(tempString);
    }
    return out;
}

function isWhitespace(character) {
    return WHITESPACE_CHARACTERS.hasOwnProperty(character);
}

function trimQuotes(string) {
    return string.replace(/(^["']|["']$)/g, '');
}

function parse(readableStream) {
    return new Promise(function(resolve, reject) {
        var out = {};
        readableStream.on('data', function(chunk) {
            out = deepParse(chunk, {index: 0});
        });

        readableStream.on('end', function() {
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
