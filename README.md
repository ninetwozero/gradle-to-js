# gradle-to-js

[![Build Status](https://travis-ci.org/ninetwozero/gradle-to-js.svg?branch=master)](https://travis-ci.org/ninetwozero/gradle-to-js)

# What's this `gradle-to-js` thing?
gradle-to-js is a quick & dirty Gradle build file to JavaScript object parser. It is quick & dirty in the sense that it doesn't give you an exact replica of whatever the build file represents during runtime, as evaluations and similar bits are (currently) too much of a hassle to accurately represent while parsing.

# Installation
Simply run the following command to include it into your project:
```
npm install gradle-to-js --save
```
# Usage
## As a module
Using `gradle-to-js` as a module, you can parse both strings and files as seen below.

### Files
```
var g2js = require('gradle-to-js/lib/parser');
g2js.parseFile('path/to/buildfile').then(function(representation) {
  console.log(representation);
});
```

### Strings
```
var g2js = require('gradle-to-js/lib/parser');
g2js.parseText('key "value"').then(function(representation) {
  console.log(representation);
});
```

The promise will eventually resolve an object matching the build file structure and values.

### Using the CLI
You can also use the module directly from the CLI, and get a json representation out of it. Nifty ey? Currently only supporting files from this direction.

```
$ ./index.js test/sample-data/small.build.gradle
{
  "testblock": {
    "key1": "value1",
    "key2": "value2",
    "nestedKey": {
      "key3": "value3",
      "key4": "value4",
      "key5": {
        "key6": "value6"
      }
    }
  },
  "testblock2": {
    "key1": "value1",
    "key2": "value2"
  },
  "testblock3": "not really"
}
```

# Author
[Karl Lindmark](https://www.github.com/karllindmark)

# License
Apache 2.0
