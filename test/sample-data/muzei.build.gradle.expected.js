exports.expected = {
    buildscript: {
      repositories: [
        {
          data: {
            name: 'mavenCentral()'
          },
          type: 'unknown'
        }
      ],
      dependencies: [
        {
          group: '',
          name: 'rootProject.ext.gradleClasspath',
          version: '',
          type: 'classpath',
          excludes: []
        }
      ]
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

    dependencies: [
      {
        group: 'com.squareup.okhttp',
        name: 'okhttp',
        version: '2.1.0',
        type: 'compile',
        excludes: []
      },
      {
        group: 'com.squareup.okhttp',
        name: 'okhttp-urlconnection',
        version: '2.1.0',
        type: 'compile',
        excludes: []
      },
      {
        group: 'com.squareup.picasso',
        name: 'picasso',
        version: '2.4.0',
        type: 'compile',
        excludes: []
      },
      {
        group: 'com.google.android.gms',
        name: 'play-services-wearable',
        version: '8.3.0',
        type: 'compile',
        excludes: []
      },
      {
        group: 'de.greenrobot',
        name: 'eventbus',
        version: '2.4.0',
        type: 'compile',
        excludes: []
      },
      {
        group: 'com.android.support',
        name: 'appcompat-v7',
        version: '23.1.1',
        type: 'compile',
        excludes: []
      },
      {
        group: 'com.android.support',
        name: 'recyclerview-v7',
        version: '23.1.1',
        type: 'compile',
        excludes: []
      },
      {
        group: 'com.android.support',
        name: 'design',
        version: '23.1.1',
        type: 'compile',
        excludes: []
      },
      {
        group: 'com.android.support',
        name: 'customtabs',
        version: '23.1.1',
        type: 'compile',
        excludes: []
      },
      {
        group: '',
        name: 'project(\':android-client-common\')',
        version: '',
        type: 'compile',
        excludes: []
      },
      {
        group: '',
        name: 'project(path: \':wearable\', configuration: \'devRelease\')',
        version: '',
        type: 'devWearApp',
        excludes: []
      },
      {
        group: '',
        name: 'project(path: \':wearable\', configuration: \'prodRelease\')',
        version: '',
        type: 'prodWearApp',
        excludes: []
      }
    ]
  }
