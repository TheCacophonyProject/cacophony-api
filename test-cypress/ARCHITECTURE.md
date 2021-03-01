# Architecture

## Unique names for users, groups and cameras

To make it possible to rerun tests without restarting the database, user, group and camera names are made unique across runs. 

Thus the username "grant" would become something like cy_grant_010c03fb.  
* **cy_**  is prepended to indicate that it is a test artifact.  (This allows us to delete such artifacts from our test server)
* **_xxxxxxxx**  A random string is postpended to make it unique accross test runs.  The same random string is used for all tests within the same test run.

Sometimes, when developing a test you might want to user the same user, group etc accross run.   You can do this by setting what the random string will be.   In the above case use:
```
  // this must be done before any names are used. 
  initializeTestNames('010c03fb');
```

## Logging in to browse

If you wish to log into the web app using an user account you created then the password is **p + username**.  For example in the above example the password would be **pcy_grant_010c03fb**


## Running tests ##

It goes without saying that all tests should run:
  * Individually - as single it(....)
  * As part of the suite of all tests

You can reuse users, cameras etc within a file, but only if each of the individual tests don't rely object created by other parts of the test.


## **TEST** logging to describe test.

When creating test please keep in mind that people in the future will have to maintain the test.   In order to do that, the maintainer needs to understand 
what the test is doing and why the test is meaningful.  

To help future maintainers, all tests should have **logTestDescription** statements which describe what the test is doing.   These statements
are logged in the development test runner as **TEST** which and should make it much easier for test developers to understand and therefore fix broken tests.   
Most custom cy function should have a **logTestDescription** statement, and there may be other times that need them too. 

When creating a **logTestDescription** you can also add a map of extra information.   This will show up in the console of the development test runner, 
if the line is clicked.   So add any extra information that you think may be userful. 

In the future we may also use these statements to describe what our tests do to document such behaviour as the criteria around visits.   In such areas the
idea is quite simple, but there is enough complexity that only fine grain examples can really define what is happening. 

