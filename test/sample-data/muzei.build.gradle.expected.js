(function() {
  return {
    buildscript: {
      repositories: [
        'mavenCentral()'
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
        minSdkVersion: 17,
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
          minSdkVersion: 21,
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
})();
