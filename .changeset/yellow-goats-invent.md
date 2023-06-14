---
'@frontside/backstage-ingestion-tests': minor
---

The ingestion test logs were dropped into a logs folder and every test would overwrite the file. This adds an option to pass an additional prefix which allows per file, per suite and/or per test log files irrespective of the test runner.
