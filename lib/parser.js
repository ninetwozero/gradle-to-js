/* jshint node: true */
'use strict';
var stream = require('stream');
var fs = require('fs');
var Promise = require('bluebird');
var deepAssign = require('deep-assign')

var exports = module.exports = {};

var CHAR_NEWLINE = 10;
var CHAR_SPACE = 32;
var CHAR_LEFT_PARENTHESIS = 40;
var CHAR_RIGHT_PARENTHESIS = 41;
var CHAR_SLASH = 47;
var CHAR_EQUALS = 61;
var CHAR_ARRAY_START = 91;
var CHAR_ARRAY_END = 93;
var CHAR_BLOCK_START = 123;
var CHAR_BLOCK_END = 125;

var KEYWORD_DEF = 'def';
var KEYWORD_IF = 'if';

var WHITESPACE_CHARACTERS = {};
WHITESPACE_CHARACTERS[CHAR_NEWLINE] = true;
WHITESPACE_CHARACTERS[CHAR_SPACE] = true;

var SPECIAL_KEYS = {
  repositories: parseRepositoryClosure
};

function deepParse(chunk, state, keepFunctionCalls, skipEmptyValues) {
  var out = {};

  var chunkLength = chunk.length;
  var character = 0;
  var tempString = '';
  var commentText = '';

  var currentKey = '';
  var parsingKey = true;
  var isBeginningOfLine = true;

  if (typeof skipEmptyValues === 'undefined') {
    skipEmptyValues = true;
  }

  for (; state.index < chunkLength; state.index++) {
    character = chunk[state.index];

    if (isBeginningOfLine && isWhitespace(character)) {
      continue;
    }

    if (!state.comment.parsing && isBeginningOfLine && isStartOfComment(tempString)) {
      isBeginningOfLine = false;
      if (isSingleLineComment(tempString)) {
        state.comment.setSingleLine();
      } else {
        state.comment.setMultiLine();
      }
      continue;
    }

    if (state.comment.multiLine && isEndOfMultiLineComment(commentText)) {
      state.comment.reset();

      isBeginningOfLine = true;
      tempString = '';
      commentText = '';
      continue;
    }

    if (state.comment.parsing && character != CHAR_NEWLINE) {
      commentText += String.fromCharCode(character);
      continue;
    }

    if (state.comment.parsing && character === CHAR_NEWLINE) {
      if (state.comment.singleLine) {
        state.comment.reset();
        isBeginningOfLine = true;

        currentKey = '';
        tempString = '';
        commentText = '';
        continue;
      } else {
        // NO-OP
        continue;
      }
    }

    if (parsingKey && !keepFunctionCalls && character === CHAR_LEFT_PARENTHESIS) {
      skipFunctionCall(chunk, state);
      currentKey = '';
      tempString = '';
      continue;
    }

    if (character === CHAR_NEWLINE) {
      if (!currentKey && tempString) {
        currentKey = tempString;
        tempString = '';
      }

      if (tempString || (currentKey && !skipEmptyValues)) {
        addValueToStructure(out, currentKey, trimWrappingQuotes(tempString));

        currentKey = '';
        tempString = '';
      }

      parsingKey = true;
      isBeginningOfLine = true;

      state.comment.reset();
      continue;
    }

    // Only parse as an array if the first *real* char is a [
    if (!parsingKey && !tempString && character === CHAR_ARRAY_START) {
      out[currentKey] = parseArray(chunk, state);
      currentKey = '';
      tempString = '';
      continue;
    }

    if (character === CHAR_BLOCK_START) {
      state.index++; // We need to skip the start character

      if (SPECIAL_KEYS.hasOwnProperty(currentKey)) {
        out[currentKey] = SPECIAL_KEYS[currentKey](chunk, state);
      } else {
        if (out[currentKey]) {
          out[currentKey] = deepAssign({}, out[currentKey], deepParse(chunk, state, keepFunctionCalls, skipEmptyValues));
        } else {
          out[currentKey] = deepParse(chunk, state, keepFunctionCalls, skipEmptyValues);
        }
      }
      currentKey = '';
    } else if (character === CHAR_BLOCK_END) {
      currentKey = '';
      tempString = '';
      break;
    } else if (isDelimiter(character) && parsingKey) {
      if (isKeyword(tempString)) {
        if (tempString === KEYWORD_DEF) {
          tempString = fetchDefinedNameOrSkipFunctionDefinition(chunk, state);
        } else if (tempString === KEYWORD_IF) {
          skipIfBlock(chunk, state);
          currentKey = '';
          tempString = '';
          continue;
        }
      }

      currentKey = tempString;
      tempString = '';
      parsingKey = false;
      if (!currentKey) {
        continue;
      }
    } else {
      if (!tempString && isDelimiter(character)) {
        continue;
      }
      tempString += String.fromCharCode(character);
      isBeginningOfLine = isBeginningOfLine && (character === CHAR_SLASH || isStartOfComment(tempString));
    }
  }

  // Add the last value to the structure
  addValueToStructure(out, currentKey, trimWrappingQuotes(tempString));
  return out;
}

function skipIfBlock(chunk, state) {
  skipFunctionCall(chunk, state);

  var character = '';
  var hasFoundTheCurlyBraces = false;
  var curlyBraceCount = 0;
  for (var max = chunk.length; state.index < max; state.index++) {
    character = chunk[state.index];
    if (character === CHAR_BLOCK_START) {
      hasFoundTheCurlyBraces = true;
      curlyBraceCount++;
    } else if (character === CHAR_BLOCK_END) {
      curlyBraceCount--;
    }

    if (hasFoundTheCurlyBraces && curlyBraceCount === 0) {
      break;
    }
  }
  return curlyBraceCount === 0;
}

function skipFunctionDefinition(chunk, state) {
  var start = state.index;
  var parenthesisNest = 1;
  var character = chunk[++state.index];
  while (character !== undefined && parenthesisNest) {
    if (character === CHAR_LEFT_PARENTHESIS) {
      parenthesisNest++;
    } else if (character === CHAR_RIGHT_PARENTHESIS) {
      parenthesisNest--;
    }

    character = chunk[++state.index];
  }

  while (character && character !== CHAR_BLOCK_START) {
    character = chunk[++state.index];
  }

  character = chunk[++state.index];
  var blockNest = 1;
  while (character !== undefined && blockNest) {
    if (character === CHAR_BLOCK_START) {
      blockNest++;
    } else if (character === CHAR_BLOCK_END) {
      blockNest--;
    }

    character = chunk[++state.index];
  }

  state.index--;
}

function parseRepositoryClosure(chunk, state) {
  var out = [];
  var repository = deepParse(chunk, state, true, false);
  Object.keys(repository).map(function(item) {
    if (repository[item]) {
      out.push({type: item, data: repository[item]});
    } else {
      out.push({type: 'unknown', data: {name: item}});
    }
  });
  return out;
}

function fetchDefinedNameOrSkipFunctionDefinition(chunk, state) {
  var character = 0;
  var temp = '';
  var isVariableDefinition = true;
  for (var max = chunk.length; state.index < max; state.index++) {
    character = chunk[state.index];

    if (character === CHAR_EQUALS) {
      // Variable definition, break and return name
      break;
    } else if (character === CHAR_LEFT_PARENTHESIS) {
      // Function definition, skip parsing
      isVariableDefinition = false;
      skipFunctionDefinition(chunk, state);
      break;
    }

    temp += String.fromCharCode(character);
  }

  if (isVariableDefinition) {
    var values = temp.trim().split(' ');
    return values[values.length - 1];
  } else {
    return '';
  }
}

function parseArray(chunk, state) {
  var character = 0;
  var temp = '';
  for (var max = chunk.length; state.index < max; state.index++) {
    character = chunk[state.index];
    if (character === CHAR_ARRAY_START) {
      continue;
    } else if (character === CHAR_ARRAY_END) {
      break;
    }
    temp += String.fromCharCode(character);
  }

  return temp.split(',').map(function(item) {
    return trimWrappingQuotes(item.trim());
  });
}

function skipFunctionCall(chunk, state) {
  var openParenthesisCount = 0;
  var character = '';
  for (var max = chunk.length; state.index < max; state.index++) {
    character = chunk[state.index];
    if (character === CHAR_LEFT_PARENTHESIS) {
      openParenthesisCount++;
    } else if (character === CHAR_RIGHT_PARENTHESIS) {
      openParenthesisCount--;
    }

    if (openParenthesisCount === 0) {
      break;
    }
  }
  return openParenthesisCount === 0;
}

function isKeyword(string) {
  return string === KEYWORD_DEF || string === KEYWORD_IF;
}

function isSingleLineComment(startOfComment) {
  return startOfComment === '//';
}

function addValueToStructure(structure, currentKey, value) {
  if (currentKey) {
    if (structure.hasOwnProperty(currentKey)) {
      if (structure[currentKey].constructor === Array) {
        structure[currentKey].push(getRealValue(value));
      } else {
        var oldValue = structure[currentKey];
        structure[currentKey] = [oldValue, getRealValue(value)];
      }
    } else {
      structure[currentKey] = getRealValue(value);
    }
  }
}

function getRealValue(value) {
  if (value === 'true' || value === 'false') { // booleans
    return value === 'true';
  }

  return value;
}

function isDelimiter(character) {
  return character === CHAR_SPACE || character === CHAR_EQUALS;
}

function isWhitespace(character) {
  return WHITESPACE_CHARACTERS.hasOwnProperty(character);
}

function trimWrappingQuotes(string) {
  var firstCharacter = string.slice(0, 1);
  if (firstCharacter === '"') {
    return string.replace(/^"([^"]+)"$/g, '$1');
  } else if (firstCharacter === '\'') {
    return string.replace(/^'([^']+)'$/g, '$1');
  }
  return string;
}

function isStartOfComment(snippet) {
  return snippet === '/*' || snippet === '//';
}

function isEndOfMultiLineComment(comment) {
  return comment.indexOf('*/') != -1;
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

          setSingleLine: function() {
            this._setCommentState(true, false);
          },
          setMultiLine: function() {
            this._setCommentState(false, true);
          },
          reset: function() {
            this._setCommentState(false, false);
          },
          _setCommentState: function(singleLine, multiLine) {
            this.singleLine = singleLine;
            this.multiLine = multiLine;
            this.parsing = singleLine || multiLine;
          }
        }
      };
      out = deepParse(chunk, state, false, undefined);
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

module.exports = {
  parseText: parseText,
  parseFile: parseFile
};
