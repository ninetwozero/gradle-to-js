'use strict';
var expect = require('chai').expect;
var multiline = require('multiline');

var parser = require('../lib/parser');

describe('Gradle build file parser', function() {
  describe('Text parsing', function() {
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
            */      });

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
    // TODO: Add test for ...
  });
  describe('File parsing', function() {
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
      var expected = {
        buildscript: {
          repositories: [
                        {
                          data: {
                            name: 'mavenCentral()'
                          },
                          type: 'unknown'
                        }
                    ],
          dependencies: {
            classpath: 'rootProject.ext.gradleClasspath'
          }
        },
        apply: 'plugin: \'com.android.application\'',
        'project.archivesBaseName': 'muzei',

        repositories: [
                    {
                      data: {
                        name: 'mavenCentral()'
                      },
                      type: 'unknown'
                    }
                ],

        android: {
          compileSdkVersion: 'rootProject.ext.compileSdkVersion',
          buildToolsVersion: 'rootProject.ext.buildToolsVersion',

          versionProps: 'new Properties()',
          defaultConfig: {
            minSdkVersion: '17',
            targetSdkVersion: 'rootProject.ext.targetSdkVersion',
            renderscriptTargetApi: 'rootProject.ext.targetSdkVersion',
            renderscriptSupportModeEnabled: true,

            versionCode: 'versionProps[\'code\'].toInteger()',
            versionName: 'versionProps[\'name\']'
          },

          signingConfigs: {
            release: {
              keyProps: 'new Properties()',
              localProps: 'new Properties()',

              storeFile: 'keyProps["store"] != null ? file(keyProps["store"]) : null',
              keyAlias: 'keyProps["alias"] ?: ""',
              storePassword: 'keyProps["storePass"] ?: ""',
              keyPassword: 'keyProps["pass"] ?: ""'
            }
          },

          productFlavors: {
            dev: {
              minSdkVersion: '21',
              multiDexEnabled: true
            },
            prod: {}
          },

          buildTypes: {
            debug: {
              versionNameSuffix: ' Debug'
            },
            release: {
              minifyEnabled: true,
              shrinkResources: true,
              proguardFiles: 'getDefaultProguardFile(\'proguard-android.txt\'), file(\'proguard-project.txt\')',
              signingConfig: 'signingConfigs.release'
            },
            publicBeta: {
              minifyEnabled: true,
              shrinkResources: true,
              proguardFiles: 'getDefaultProguardFile(\'proguard-android.txt\'), file(\'proguard-project.txt\')',
              versionNameSuffix: '" " + versionProps[\'betaNumber\']'
            },
            publicDebug: {
              debuggable: true,
              renderscriptDebuggable: true,
              minifyEnabled: true,
              shrinkResources: true,
              proguardFiles: 'getDefaultProguardFile(\'proguard-android.txt\'), file(\'proguard-project.txt\')',
              versionNameSuffix: '" Debug " + versionProps[\'betaNumber\']'
            }
          },

          compileOptions: {
            sourceCompatibility: 'JavaVersion.VERSION_1_7',
            targetCompatibility: 'JavaVersion.VERSION_1_7'
          }
        },

        dependencies: {
          compile: [
              'com.squareup.okhttp:okhttp:2.1.0',
              'com.squareup.okhttp:okhttp-urlconnection:2.1.0',
              'com.squareup.picasso:picasso:2.4.0',
              'com.google.android.gms:play-services-wearable:8.3.0',
              'de.greenrobot:eventbus:2.4.0',
              'com.android.support:appcompat-v7:23.1.1',
              'com.android.support:recyclerview-v7:23.1.1',
              'com.android.support:design:23.1.1',
              'com.android.support:customtabs:23.1.1',
              'project(\':android-client-common\')'
          ],
          devWearApp: 'project(path: \':wearable\', configuration: \'devRelease\')',
          prodWearApp: 'project(path: \':wearable\', configuration: \'prodRelease\')'
        }
      };
      return parser.parseFile(sampleFilePath).then(function(parsedValue) {
        expect(parsedValue).to.deep.equal(expected);
      });
    });
  });
});
