exports.expected = {
    buildscript: {
      'project.ext': {
        implementationVendor: 'Asdffgh',
        jdkVersion: '1.8',
        VERSION_FILE: 'src/main/resources/version.properties',
        DEFAULT_MAJOR_VALUE: '0',
        DEFAULT_MINOR_VALUE: '0',
        DEFAULT_PATCH_VALUE: '0'
      },
      'project.ext.nextRepo': {
        credentials: {
          username: 'nextUsername',
          password: 'nextPassword'
        },
        url: 'nextUrl'
      }
    },
    plugins: {
      id: [
        'maven-publish',
        '\'org.poiuytr.qwerty\' version \'1.6.0\''
      ]
    },
    subprojects: {
      apply: [
        'plugin: \'java\'',
        'plugin: \'maven-publish\'',
        'plugin: \'idea\'',
        'plugin: \'dinfgubs\'',
        'plugin: \'checkmbnm\'',
        'plugin: \'tototo\''
      ],
      sourceCompatibility: 'jdkVersion',
      targetCompatibility: 'jdkVersion',
      processResources: {
        dependsOn: 'addVersionPropertyFile'
      },
      dinfgubs: {
        toolVersion: '3.0.1',
        effort: 'max',
        reportLevel: 'low',
        reportsDir: 'file(\'build/reports/quality/dinfgubsReports\')',
        excludeFilter: 'file(\'../quality/config/dinfgubs_exclude.xml\')'
      },
      checkmbnm: {
        toolVersion: '7.4',
        configFile: 'file(\'../quality/config/checkmbnm.xml\')',
        reportsDir: 'file(\'build/reports/quality/checkmbnmReports\')'
      },
      tototo: {
        toolVersion: '0.7.9'
      },
      tototoTestReport: {
        group: 'reporting',
        description: 'Lorem Ipsum',
        dependsOn: 'tasks.test',
        additionalSourceDirs: 'files(sourceSets.main.allSource.srcDirs)',
        classDirectories: 'files(sourceSets.main.output)',
        sourceDirectories: 'files(sourceSets.main.allSource.srcDirs)',
        reports: {
          'csv.enabled': false,
          html: {
            enabled: true,
            destination: {}
          },
          'xml.enabled': false
        }
      },
      repositories: [
        {
          type: 'unknown',
          data: {
            name: 'mavenLocal()'
          }
        },
        {
          type: 'unknown',
          data: {
            name: 'maven(nextRepo)'
          }
        }
      ],
      group: 'com.test.lambda.checkout',
      jar: {
        manifest: {},
        from: 'sourceSets.main.output'
      },
      publishing: {
        publications: {
          'mavenJava(MavenPublication)': {
            from: 'components.java',
            artifact: {
              classifier: 'distribution'
            }
          }
        }
      }
    },
    'ext.newVersion': [
      'major: DEFAULT_MAJOR_VALUE',
      'minor: DEFAULT_MINOR_VALUE',
      'patch: DEFAULT_PATCH_VALUE'
    ]
  }