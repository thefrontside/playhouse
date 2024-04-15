#!/bin/sh

currentDir=$(cd $(dirname "$0") && pwd)
echo ===================================
echo Exporting frontend plugin
echo ===================================
cd $currentDir/..
npx --yes @janus-idp/cli@1.7.10 package export-dynamic-plugin --embed-as-dependencies --clean
npm pack ./ --pack-destination $currentDir/output 
echo ===================================
echo Exporting backend plugin
echo ===================================
cd $currentDir/../../humanitec-backend
npx --yes @janus-idp/cli@1.7.10 package export-dynamic-plugin --embed-as-dependencies --clean
npm pack ./dist-dynamic --pack-destination $currentDir/output 
echo ===================================
echo Exporting backend scaffolder module
echo ===================================
cd $currentDir/../../humanitec-backend-scaffolder-module
npx --yes @janus-idp/cli@1.7.10 package export-dynamic-plugin --embed-as-dependencies --embed-package @frontside/backstage-plugin-humanitec-backend --clean
npm pack ./dist-dynamic --pack-destination $currentDir/output 
