# @frontside/backstage-ingestion-tests

## 0.6.1

### Patch Changes

- 181c413: Upgraded to Backstage 1.17

## 0.6.0

### Minor Changes

- 226363d: The ingestion test logs were dropped into a logs folder and every test would overwrite the file. This adds an option to pass an additional prefix which allows per file, per suite and/or per test log files irrespective of the test runner.

## 0.5.1

### Patch Changes

- 4850b45: In a previous PR, we removed the built-in Github API simulator opting for the start that up in userland. This removes the dependency itself which was missed.

## 0.5.0

### Minor Changes

- ac51d05: Remove github API simulator from the backstage harness. It can
  be started separately

### Patch Changes

- d8cbd21: bump backstage

## 0.4.5

### Patch Changes

- 1c1b178: Upgraded to Backstage 1.12.1

## 0.4.4

### Patch Changes

- 05f3423: Upgraded to Backstage 1.11.1

## 0.4.3

### Patch Changes

- d803873: upgrade backstage dependencies

## 0.4.2

### Patch Changes

- d62b0ad: Upgraded to Backstage 1.9

## 0.4.1

### Patch Changes

- 632259b: bail if the client is no pg in clearTestDatabases

## 0.4.0

### Minor Changes

- 9b212b5: createBackstageHarness now takes an npm script to start the backstage process

## 0.3.1

### Patch Changes

- 00756f7: Add createBackstageHarness to @frontside/backstage-ingestion-tests

## 0.3.0

### Minor Changes

- b48e919: add publishConfig to @frontside/backstage-ingestion-tests

## 0.2.0

### Minor Changes

- adf3232: add @frontside/backstage-ingestion-tests package
