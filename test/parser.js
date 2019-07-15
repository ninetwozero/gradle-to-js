'use strict';
var expect = require('chai').expect;
var multiline = require('multiline');

var parser = require('../lib/parser');

describe('Gradle build file parser', function() {
  describe('(text parsing)', function() {
    it('can parse a single <<key value>>', function() {
      var dsl = 'key "value"';
      var expected = {key: 'value'};

      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('can parse a single key=value', function() {
      var dsl = 'key = "value"';
      var expected = {key: 'value'};
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('can parse a multiple <<key value>> combinations', function() {
      var dsl = multiline.stripIndent(function() {/*
             key "value"
             key2 "value2"
             */
      });
      var expected = {key: 'value', key2: 'value2'};

      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('can parse a multiple <<key=value>> combinations', function() {
      var dsl = multiline.stripIndent(function() {/*
             key = "value"
             key2 = "value2"
             */
      });
      var expected = {key: 'value', key2: 'value2'};

      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('can detect a block', function() {
      var dsl = multiline.stripIndent(function() {/*
             testblock {

             }
             */
      });
      var expected = {testblock: {}};

      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });

    });

    it('can detect a single level block and its values', function() {
      var dsl = multiline.stripIndent(function() {/*
             testblock {
             key1 "value1"
             key2 "value2"
             }
             */
      });
      var expected = {testblock: {key1: 'value1', key2: 'value2'}};

      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });

    });

    it('can detect a multiple single level block and their values', function() {
      var dsl = multiline.stripIndent(function() {/*
             testblock {
             key1 "value1"
             key2 "value2"
             }
             testblock2 {
             key3 "value3"
             key4 "value4"
             }
             */
      });
      var expected = {
        testblock: {key1: 'value1', key2: 'value2'},
        testblock2: {key3: 'value3', key4: 'value4'}
      };

      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });

    });

    it('can detect a mix of single level items', function() {
      var dsl = multiline.stripIndent(function() {/*
             testblock {
             key1 "value1"
             key2 "value2"
             }
             testblock3 "not really"
             testblock2 {
             key3 "value3"
             key4 "value4"
             }
             */
      });
      var expected = {
        testblock: {key1: 'value1', key2: 'value2'},
        testblock2: {key3: 'value3', key4: 'value4'},
        testblock3: 'not really'
      };

      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });

    });

    it('can detect chaos', function() {
      var dsl = multiline.stripIndent(function() {/*
             testblock {
             key1 "value1"
             key2 "value2"
             nestedKey {
             key3 "value3"
             key4 "value4"
             key5 {
             key6 "value6"
             }
             }
             }
             testblock2 {
             key1 "value1"
             key2 "value2"
             }
             testblock3 "not really"
             */
      });
      var expected = {
        testblock: {
          key1: 'value1',
          key2: 'value2',
          nestedKey: {
            key3: 'value3',
            key4: 'value4',
            key5: {
              key6: 'value6'
            }
          }
        },
        testblock2: {key1: 'value1', key2: 'value2'},
        testblock3: 'not really'
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });

    });

    it('will skip commented lines', function() {
      var dsl = 'key "value"' + '\n';
      dsl += '// this is a single line comment' + '\n';
      dsl += 'key2 "value2"' + '\n';
      dsl += '/* this is a multi' + '\n';
      dsl += 'line comment */' + '\n';
      dsl += '    key3 "value3"' + '\n';
      dsl += '/**' + '\n';
      dsl += ' *' + '\n';
      dsl += ' * Something here' + '\n';
      dsl += ' *' + '\n';
      dsl += ' */';

      var expected = {key: 'value', key2: 'value2', key3: 'value3'};
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });
    it('will store multiple occurences of a key as an array', function() {
      var dsl = multiline.stripIndent(function() {/*
                testblock {
                    key1 "value1"
                    key1 "value2"
                }
                key1 "value3"
                key1 "value4"
            */      });

      var expected = {
        testblock: {
          key1: ['value1', 'value2']
        },
        key1: ['value3', 'value4']
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('will be able to parse a list of items', function() {
      var dsl = multiline.stripIndent(function() {/*
                testblock {
                    key1 ["value1", "value2"]
                }
                key1 ["value3", "value4"]
                specialKey " " + key1["sausage"]
            */      });

      var expected = {
        testblock: {
          key1: ['value1', 'value2']
        },
        key1: ['value3', 'value4'],
        specialKey: '" " + key1["sausage"]'
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    // Because the scoping that def imposes doesn't make a difference for us
    it('should be able to collect definitions as regular variables', function() {
      var dsl = multiline.stripIndent(function() {/*
             def myVar1 = new Var()
             def myVar2 = new Var(2)
             */      });

      var expected = {
        myVar1: 'new Var()',
        myVar2: 'new Var(2)'
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('should be able to collect complex definitions as regular variables', function() {
      var dsl = multiline.stripIndent(function() {/*
             def MyType myVar1 = new Var()
             def MyType myVar2 = new Var(2)
             */      });

      var expected = {
        myVar1: 'new Var()',
        myVar2: 'new Var(2)'
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('should skip (seemingly) function calls to variables', function() {
      var dsl = multiline.stripIndent(function() {/*
             def MyType myVar1 = new Var()
             myVar1.loadSomething(new Cake())
             */      });

      var expected = {
        myVar1: 'new Var()'
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('should group repositories into an array', function() {
      var dsl = multiline.stripIndent(function() {/*
             repositories {
                mavenCentral()
                maven {
                    url "http://test"
                }
             }
            */});

      var expected = {
        repositories: [
            {type: 'unknown', data: {name: 'mavenCentral()'}},
            {type: 'maven', data: {url: 'http://test'}}
        ]
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('should group plugins into an array with a given format', function() {
      var dsl = multiline.stripIndent(function() {/*
             plugins {
                id 'some.id.here' version 'some.version.here'
                id 'another.id.here'
                version 'some.other.version.here' id 'some.other.id.here'
             }
            */});

      var expected = {
        plugins: [
            {id: 'some.id.here', version: 'some.version.here'},
            {id: 'another.id.here'},
            {id: 'some.other.id.here', version: 'some.other.version.here'},
        ]
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('should be able to parse booleans into booleans', function() {
      var dsl = multiline.stripIndent(function() {/*
             myVar1 true
             someAttribute true
             someFalseAttribute false
             myVar2 false
             */
      });

      var expected = {
        myVar1: true,
        someAttribute: true,
        someFalseAttribute: false,
        myVar2: false
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('should parse numbers as strings', function() {
      var dsl = multiline.stripIndent(function() {/*
             myVar301 1
             myVar402 32
             myVar103 33
             myVar204 4
             */      });

      var expected = {
        myVar301: '1',
        myVar402: '32',
        myVar103: '33',
        myVar204: '4'
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });
    it('can skip if blocks', function() {
      var dsl = multiline.stripIndent(function() {/*
             myVar1 "a"
             if (myVar301 === "sausage") {
                myVar2 "b"
             }
             myVar2 "c"
             */      });

      var expected = {
        myVar1: 'a',
        myVar2: 'c'
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('can skip if clauses without brackets', function() {
      var dsl = multiline.stripIndent(function() {/*
             myVar1 "a"
             if (myBreakfast === "eggs") myVar1 "b"
             myVar2 "c"
             if (myBreakfast === "bacon")
                myVar2 "d"
             */      });

      var expected = {
        myVar1: 'a',
        myVar2: 'c'
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
});

    it('can skip function definitions', function() {
      var dsl = multiline.stripIndent(function() {/*
             myVar1 "a"
             def fibonacci (int i) {
               if (i <= 2) {
                 return 1;
               } else {
                 return fibonacci(i - 1) + fibonacci(i - 2);
               }
             }
             myVar2 "c"
             */      });

      var expected = {
        myVar1: 'a',
        myVar2: 'c'
      };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('will manage to parse closures that have brackets on another line', function() {
      var dsl = multiline.stripIndent(function() {/*
        android {
          property1 'one'
        }

        android
        {
          property2 'two'
        }
      */});

      var expected = { android: { property1: 'one', property2: 'two'} };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('will merge multiple closures with the same key into one', function() {
      var dsl = multiline.stripIndent(function() {/*
        android {
          property1 'one'
        }

        android {
          property2 'two'
        }

        android {
          property3 'three'
        }
      */});

      var expected = { android: { property1: 'one', property2: 'two', property3: 'three' } };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });
    it('will deep merge multiple complex closures with the same key into one', function() {
      var dsl = multiline.stripIndent(function() {/*
        foo {
          android {
            property1 'one'
          }

          android {
            property2 'two'
          }

          android {
            property3 'three'
          }

          android {
            property4 'four'
          }
        }
      */});

      var expected = {foo: { android: { property1: 'one', property2: 'two', property3: 'three', property4: 'four' } } };
      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('will handle compile keywords separately', function() {
      var dsl = multiline.stripIndent(function() {/*
      dependencies {
        compile (project(':react-native-maps')) {
          exclude group: 'com.google.android.gms', module: 'play-services-base'
          exclude group: 'com.google.android.gms', module: 'play-services-maps'
        }
        compile (project(':react-native-background-geolocation')) {
          exclude group: 'com.google.android.gms', module: 'play-services-location'
        }
        compile 'g1:a1:v1'
        compile group: 'g2', name: 'a2', version: 'v2'
      }
      */});

      var expected = {
        dependencies: [
          {
            group: '',
            name: 'project(\':react-native-maps\')',
            version: '',
            type: 'compile',
            excludes: [
              {
                group: 'com.google.android.gms',
                module: 'play-services-base'
              },
              {
                group: 'com.google.android.gms',
                module: 'play-services-maps'
              }
            ]
          },
          {
            group: '',
            name: 'project(\':react-native-background-geolocation\')',
            version: '',
            type: 'compile',
            excludes: [
              {
                group: 'com.google.android.gms',
                module: 'play-services-location'
              }
            ]
          },
          {
            group: 'g1',
            name: 'a1',
            version: 'v1',
            type: 'compile',
            excludes: []
          },
          {
            group: 'g2',
            name: 'a2',
            version: 'v2',
            type: 'compile',
            excludes: []
          }
        ]
      };

      return parser.parseText(dsl).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('can handle Windows style CRLF gradle files accordingly', function() {
        var sampleFilePath = 'test/sample-data/windows_crlf.gradle';
        var expected = require(process.cwd() + '/test/sample-data/windows_crlf.gradle.expected.js').expected;

        return parser.parseFile(sampleFilePath).then(function(parsedValue) {
          expect(parsedValue).to.deep.equal(expected);
        });
    });
    // TODO: Add test for ...
  });
  describe('(file parsing)', function() {
    it('should be able to parse the small sample gradle file', function() {
      var sampleFilePath = 'test/sample-data/small.build.gradle';
      var expected = {
        testblock: {
          key1: 'value1',
          key2: 'value2',
          nestedKey: {
            key3: 'value3',
            key4: 'value4',
            key5: {
              key6: 'value6'
            }
          }
        },
        testblock2: {key1: 'value1', key2: 'value2'},
        testblock3: 'not really'
      };
      return parser.parseFile(sampleFilePath).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('should be able to parse the muzei gradle file', function() {
      var sampleFilePath = 'test/sample-data/muzei.build.gradle';
      var expected = require(process.cwd() + '/test/sample-data/muzei.build.gradle.expected.js').expected;

      return parser.parseFile(sampleFilePath).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('should be able to parse the ivy gradle file', function() {
      var sampleFilePath = 'test/sample-data/ivy.build.gradle';
      var expected = require(process.cwd() + '/test/sample-data/ivy.build.gradle.expected.js').expected;

      return parser.parseFile(sampleFilePath).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });

    it('should be able to parse the testCompile with multiline gradle file', function() {
      var sampleFilePath = 'test/sample-data/test.compile.build.gradle';
      var expected = require(process.cwd() + '/test/sample-data/test.compile.build.gradle.expected.js').expected;

      return parser.parseFile(sampleFilePath).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });
  });
});
