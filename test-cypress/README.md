# Cypress api tests

## To run the tests on your own machine
To set up the tests on your own machine:
1.  Go to the test-cypress folder
2.  Copy cypress.json.TEMPLATE to cypress.json.
3.  Run
``` bash
npm install
npm run dev
```
4.  Look for the [cypress](https://www.cypress.io/) interactive environment.

### Testing against a different server
You can test against code running on any environment by changing the cacophony-api-server in cypress.json 


# More information

Before you write your own tests please read the following:

[Test architecture](/test-cypress/architecture.md)