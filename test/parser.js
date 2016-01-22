'use strict';
var expect = require("chai").expect;
var multiline = require("multiline");

var parser = require("../lib/parser");

describe("Gradle build file parser", function() {
    describe.only("Text parsing", function() {
        it("can parse a single key=>value", function () {
            var dsl = 'key "value"';
            var expected = {key: "value"};

            return parser.parseText(dsl).then(function (parsedValue) {
                expect(parsedValue).to.deep.equal(expected);
            });
        });

        it("can parse a multiple key=>value combinations", function () {
            var dsl = multiline.stripIndent(function () {/*
             key "value"
             key2 "value2"
             */
            });
            var expected = {key: "value", key2: 'value2'};

            return parser.parseText(dsl).then(function (parsedValue) {
                expect(parsedValue).to.deep.equal(expected);
            });
        });

        it("can detect a block", function () {
            var dsl = multiline.stripIndent(function () {/*
             testblock {

             }
             */
            });
            var expected = {testblock: {}};

            return parser.parseText(dsl).then(function (parsedValue) {
                expect(parsedValue).to.deep.equal(expected);
            });

        });

        it("can detect a single level block and its values", function () {
            var dsl = multiline.stripIndent(function () {/*
             testblock {
             key1 "value1"
             key2 "value2"
             }
             */
            });
            var expected = {testblock: {key1: "value1", key2: "value2"}};

            return parser.parseText(dsl).then(function (parsedValue) {
                expect(parsedValue).to.deep.equal(expected);
            });

        });

        it("can detect a multiple single level block and their values", function () {
            var dsl = multiline.stripIndent(function () {/*
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
                testblock: {key1: "value1", key2: "value2"},
                testblock2: {key3: "value3", key4: "value4"}
            };

            return parser.parseText(dsl).then(function (parsedValue) {
                expect(parsedValue).to.deep.equal(expected);
            });

        });

        it("can detect a mix of single level items", function () {
            var dsl = multiline.stripIndent(function () {/*
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
                testblock: {key1: "value1", key2: "value2"},
                testblock2: {key3: "value3", key4: "value4"},
                testblock3: "not really"
            };

            return parser.parseText(dsl).then(function (parsedValue) {
                expect(parsedValue).to.deep.equal(expected);
            });

        });

        it("can detect chaos", function () {
            var dsl = multiline.stripIndent(function () {/*
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
                    key1: "value1",
                    key2: "value2",
                    nestedKey: {
                        key3: "value3",
                        key4: "value4",
                        key5: {
                            key6: "value6"
                        }
                    }
                },
                testblock2: {key1: "value1", key2: "value2"},
                testblock3: "not really"
            };
            return parser.parseText(dsl).then(function (parsedValue) {
                expect(parsedValue).to.deep.equal(expected);
            });

        });

        it("will skip commented lines", function () {
            var dsl = 'key "value"' + "\n";
            dsl += '// this is a single line comment' + "\n";
            dsl += 'key2 "value2"' + "\n";
            dsl += '/* this is a multi' + "\n";
            dsl += 'line comment */' + "\n";
            dsl += '    key3 "value3"' + "\n";
            dsl += '/**' + "\n";
            dsl += ' *' + "\n";
            dsl += ' * Something here' + "\n";
            dsl += ' *' + "\n";
            dsl += ' */';

            var expected = {key: "value", key2: 'value2', key3: "value3"};
            return parser.parseText(dsl).then(function (parsedValue) {
                expect(parsedValue).to.deep.equal(expected);
            });
        });
        it("will store multiple occurences of a key as an array", function () {
            var dsl = multiline.stripIndent(function () {/*
                testblock {
                    key1 "value1"
                    key1 "value2"
                }
                key1 "value3"
                key1 "value4"
            */});

            var expected = {
                testblock: {
                    key1: ["value1", "value2"]
                },
                key1: ["value3", "value4"]
            };
            return parser.parseText(dsl).then(function (parsedValue) {
                expect(parsedValue).to.deep.equal(expected);
            });
        });
        it.only("will be able to parse a list of items", function() {
            var dsl = multiline.stripIndent(function () {/*
                testblock {
                    key1 ["value1", "value2"]
                }
                key1 ["value3", "value4"]
            */});

            var expected = {
                testblock: {
                    key1: ["value1", "value2"]
                },
                key1: ["value3", "value4"]
            };
            return parser.parseText(dsl).then(function (parsedValue) {
                expect(parsedValue).to.deep.equal(expected);
            });
        });
        // TODO: Add test for ...
    });
    describe("File parsing", function() {
        it("should be able to parse the small sample gradle file", function() {
            var sampleFilePath = "test/sample-data/small.build.gradle";
            var expected = { 
                testblock: { 
                    key1: "value1", 
                    key2: "value2",
                    nestedKey: {
                        key3: "value3",
                        key4: "value4",
                        key5: {
                            key6: "value6"
                        }
                    }
                },
                testblock2: { key1: "value1", key2: "value2"},
                testblock3: "not really"
            };
            return parser.parseFile(sampleFilePath).then(function(parsedValue) {
                expect(parsedValue).to.deep.equal(expected);   
            });
        });

        it("should be able to parse the muzei gradle file", function() {
            var sampleFilePath = "test/sample-data/muzei.build.gradle";
            var expected = { 
                testblock: { 
                    key1: "value1", 
                    key2: "value2",
                    nestedKey: {
                        key3: "value3",
                        key4: "value4",
                        key5: {
                            key6: "value6"
                        }
                    }
                },
                testblock2: { key1: "value1", key2: "value2"},
                testblock3: "not really"
            };
            return parser.parseFile(sampleFilePath).then(function(parsedValue) {
                expect(parsedValue).to.deep.equal(expected);   
            });
        });
    });
});
