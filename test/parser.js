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
    
    // it("handles a nested object", function() {
    //     var dsl = 'block { key "value" }';
    //     var expected = { block: { key: "value" } };
    //     expect(parser.parseText(dsl)).to.equal(expected);   
    // });
});
