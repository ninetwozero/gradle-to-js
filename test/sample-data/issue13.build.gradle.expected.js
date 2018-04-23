exports.expected = {
    coverageTaskAndroidJob: {
        dep1: "tasks.getByPath(':android-job:clean')",
        description: "Runs coverage for android-job",
        group: "Coverage",
        target: "tasks.getByPath(':android-job:createCovAndroidTestCoverageReport')",
        'target.dependsOn': "dep1"
    },
    coverageTaskVolley: {
        dep1: "tasks.getByPath(':volley:clean')",
        dep2: "tasks.getByPath(':volley:testCovUnitTest')",
        description: "Runs coverage for volley",
        group: "Coverage",
        target: "tasks.getByPath(':volley:createCovCoverageReport')",
        'target.dependsOn': [
            "dep1",
            "dep2"
        ]
    }
};