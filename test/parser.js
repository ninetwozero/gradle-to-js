'use strict';
var expect = require("chai").expect;
var multiline = require("multiline");

var parser = require("../lib/parser");

describe("Gradle build file parser", function() {
    it("can parse a single key=>value", function() {
        var dsl = 'key "value"';
        var expected = { key: "value" };
        
        return parser.parseText(dsl).then(function(parsedValue) {
            expect(parsedValue).to.deep.equal(expected);   
        });
    });
    it("can parse a multiple key=>value combinations", function() {
        var dsl = multiline.stripIndent(function() {/*
            key "value"
            key2 "value2"
        */});
        var expected = { key: "value", key2: 'value2' };
        
        return parser.parseText(dsl).then(function(parsedValue) {
            expect(parsedValue).to.deep.equal(expected);   
        });
    });

    it("can detect a block", function() {
        var dsl = multiline.stripIndent(function() {/*
            testblock {

            }
        */});
        var expected = { testblock: {} };
        
        return parser.parseText(dsl).then(function(parsedValue) {
            expect(parsedValue).to.deep.equal(expected);   
        });

    });
    
    it("can detect a single level block and its values", function() {
        var dsl = multiline.stripIndent(function() {/*
            testblock {
                key1 "value1"
                key2 "value2"
            }
        */});
        var expected = { testblock: { key1: "value1", key2: "value2" } };
        
        return parser.parseText(dsl).then(function(parsedValue) {
            expect(parsedValue).to.deep.equal(expected);   
        });

    });

    it("can detect a multiple single level block and their values", function() {
        var dsl = multiline.stripIndent(function() {/*
            testblock {
                key1 "value1"
                key2 "value2"
            }
            testblock2 {
                key3 "value3"
                key4 "value4"
            }
        */});
        var expected = { testblock: { key1: "value1", key2: "value2" },
            testblock2: { key3: "value3", key4: "value4"}
        };
        
        return parser.parseText(dsl).then(function(parsedValue) {
            expect(parsedValue).to.deep.equal(expected);   
        });

    });

    it("can detect a mix of single level items", function() {
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
        */});
        var expected = { testblock: { key1: "value1", key2: "value2" },
            testblock2: { key3: "value3", key4: "value4"},
            testblock3: "not really"
        };

        return parser.parseText(dsl).then(function(parsedValue) {
            expect(parsedValue).to.deep.equal(expected);   
        });

    });

    it("can detect chaos", function() {
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
        */});
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
        return parser.parseText(dsl).then(function(parsedValue) {
            expect(parsedValue).to.deep.equal(expected);   
        });

    });
});
