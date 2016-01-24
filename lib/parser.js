'use strict';
var stream = require("stream");
var fs = require("fs");
var Promise = require("bluebird");

var exports = module.exports = {};

var CHAR_NEWLINE = 10;
var CHAR_SPACE = 32; 
var CHAR_SLASH = 47;
var CHAR_EQUALS = 61;
var CHAR_ARRAY_START = 91;
var CHAR_ARRAY_END = 93;
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
    var parsingKey = true;
    var isBeginningOfLine = true;

    for (; state.index < chunkLength; state.index++) {
        character = chunk[state.index];

        if (isBeginningOfLine && isWhitespace(character)) {
            continue;
        }

        if (!state.comment.parsing && isBeginningOfLine && isStartOfComment(tempString)) {
            isBeginningOfLine = false;
            isSingleLineComment(tempString) ? state.comment.setSingleLine() : state.comment.setMultiLine();

            continue;
        }

        if (state.comment.multiLine && isEndOfMultiLineComment(commentText)) {
            state.comment.reset();

            isBeginningOfLine = true;
            tempString = "";
            commentText = "";
            continue;
        }

        if (state.comment.parsing && character != CHAR_NEWLINE) {
            commentText += String.fromCharCode(character);
            continue;
        }

        if (state.comment.parsing && character == CHAR_NEWLINE) {
            if (state.comment.singleLine) {
                state.comment.reset();
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
            parsingKey = true;
            isBeginningOfLine = true;

            state.comment.reset();
            continue;
        }

        if (character == CHAR_ARRAY_START) {
            out[currentKey] = parseArray(chunk, state);
            currentKey = "";
            tempString = "";
            continue
        }

        if (character == CHAR_BLOCK_START) {
            state.index++; // We need to skip the start character
            out[currentKey] = deepParse(chunk, state);
            currentKey = "";
        } else if (character == CHAR_BLOCK_END) {
            currentKey = "";
            tempString = "";

            break;
        } else if (isDelimiter(character) && parsingKey) {
            if (isKeyword(tempString)) {
                tempString = fetchDefinedName(chunk, state);
            }
            currentKey = tempString;
            tempString = "";
            parsingKey = false;
        } else {
            if (!tempString && isDelimiter(character)) {
                continue;
            }
            tempString += String.fromCharCode(character);
            isBeginningOfLine = isBeginningOfLine && (character == CHAR_SLASH || isStartOfComment(tempString));
        }
    }

    // Add the last value to the structure
    addValueToStructure(out, currentKey, trimQuotes(tempString));
    return out;
}

function fetchDefinedName(chunk, state) {
    var character = 0;
    var temp = "";
    for (var max = chunk.length; state.index < max; state.index++) {
        character = chunk[state.index];

        if (character == CHAR_EQUALS) {
            break;
        }

        temp += String.fromCharCode(character);
    }
    var values = temp.trim().split(" ");
    return values[values.length - 1];
}

function parseArray(chunk, state) {
    var character = 0;
    var temp = "";
    for (var max = chunk.length; state.index < max; state.index++) {
        character = chunk[state.index];
        if (character == CHAR_ARRAY_START) {
            continue;
        } else if (character === CHAR_ARRAY_END) {
            break;
        }
        temp += String.fromCharCode(character);
    }

    return temp.split(",").map(function(item) {
        return trimQuotes(item.trim());
    });
}

function isKeyword(string) {
    return string == "def";
}

function isSingleLineComment(startOfComment) {
    return startOfComment == '//';
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

function isDelimiter(character) {
    return character == CHAR_SPACE || character == CHAR_EQUALS
}

function isWhitespace(character) {
    return WHITESPACE_CHARACTERS.hasOwnProperty(character);
}

function trimQuotes(string) {
    return string.replace(/(^["]|["]$)/g, '');
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
                comment: {
                    parsing: false,
                    singleLine: false,
                    multiLine: false,

                    setSingleLine: function () {
                        this._setCommentState(true, false);
                    },
                    setMultiLine: function () {
                        this._setCommentState(false, true);
                    },
                    reset: function () {
                        this._setCommentState(false, false);
                    },
                    _setCommentState: function (singleLine, multiLine) {
                        this.singleLine = singleLine;
                        this.multiLine = multiLine;
                        this.parsing = singleLine || multiLine;
                    }
                }
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
