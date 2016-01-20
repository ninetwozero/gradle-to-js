'use strict';
var stream = require("stream");
var fs = require("fs");
var Promise = require("bluebird");

var exports = module.exports = {};

var CHAR_NEWLINE = 10;
var CHAR_SPACE = 32; 
var CHAR_SLASH = 47;
var CHAR_BLOCK_START = 123;
var CHAR_BLOCK_END = 125;

var WHITESPACE_CHARACTERS = {};
WHITESPACE_CHARACTERS[CHAR_NEWLINE] = true;
WHITESPACE_CHARACTERS[CHAR_SPACE] = true;

function deepParse(chunk, state) {
    var out = {};

    var chunkLength = chunk.length;
    var character = 0;
    var tempString = "";
    var commentText = "";

    var currentKey = "";
    var isParsingKey = true;
    var isBeginningOfLine = true;

    for (; state.index < chunkLength; state.index++) {
        character = chunk[state.index];

        if (isBeginningOfLine && isWhitespace(character)) {
            continue;
        }

        if (!state.parsingComment && isBeginningOfLine && isStartOfComment(tempString)) {
            var singleLineComment = tempString == '//';
            state.singleLineComment = singleLineComment;
            state.multiLineComment = !singleLineComment;
            state.parsingComment = true;

            isBeginningOfLine = false;
            continue;
        }

        if (state.multiLineComment && isEndOfMultiLineComment(commentText)) {
            state.parsingComment = false;
            state.singleLineComment = false;
            state.multiLineComment = false;

            isBeginningOfLine = true;
            tempString = "";
            commentText = "";
            continue;
        }

        if (state.parsingComment && character != CHAR_NEWLINE) {
            commentText += String.fromCharCode(character);
            continue;
        }

        if (state.parsingComment && character == CHAR_NEWLINE) {
            if (state.singleLineComment) {
                state.singleLineComment = false;
                state.multiLineComment = false;
                state.parsingComment = false;
                isBeginningOfLine = true;

                currentKey = "";
                tempString = "";
                commentText = "";
                continue;
            } else {
                // NO-OP
                continue;
            }
        }

        if (character == CHAR_NEWLINE) {
            addValueToStructure(out, currentKey, trimQuotes(tempString));

            currentKey = "";
            tempString = "";
            isParsingKey = true;
            isBeginningOfLine = true;

            state.singleLineComment = false;
            state.multiLineComment = false;
            state.parsingComment = false;

            continue;
        }

        if (character == CHAR_BLOCK_START) {
            state.index++; // We need to skip the start character
            out[currentKey] = deepParse(chunk, state);
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
            tempString += String.fromCharCode(character);
            isBeginningOfLine = isBeginningOfLine && (character == CHAR_SLASH || isStartOfComment(tempString));
        }
    }

    // Add the last value to the structure
    addValueToStructure(out, currentKey, trimQuotes(tempString));
    return out;
}

function addValueToStructure(structure, currentKey, value) {
    if (currentKey && value) {
        if (structure.hasOwnProperty(currentKey)) {
            if (structure[currentKey].constructor === Array) {
                structure[currentKey].push(value);
            } else {
                var oldValue = structure[currentKey];
                structure[currentKey] = [oldValue, value];
            }
        } else {
            structure[currentKey] = value;
        }
    }
}

function isWhitespace(character) {
    return WHITESPACE_CHARACTERS.hasOwnProperty(character);
}

function trimQuotes(string) {
    return string.replace(/(^["']|["']$)/g, '');
}

function isStartOfComment(snippet) {
    return snippet == '/*' || snippet == '//';
}

function isEndOfMultiLineComment(comment) {
    return comment.indexOf("*/") != -1;
}

function parse(readableStream) {
    return new Promise(function(resolve, reject) {
        var out = {};
        readableStream.on('data', function(chunk) {
            var state = {
                index: 0,
                parsingComment: false,
                singleLineComment: false,
                multiLineComment: false       
            };
            out = deepParse(chunk, state);
        });

        readableStream.on('end', function() {
            resolve(out);
        });
        readableStream.on('error', function(error) {
            reject('Error parsing stream: ' + error);
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
    var stream = fs.createReadStream(path); 
    return parse(stream);
}

function parseUrl(url) {
    // TODO: Parse a given <<url>> using requests?
    return "parseUrl not implemented";
}

module.exports = {
    parseText: parseText,
    parseFile: parseFile,
    parseUrl: parseUrl
};
