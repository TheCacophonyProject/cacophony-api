# cacophony-api

`cacophony-api` is a node server that is accessed through a RESTful API.  This allows uploading, processing and retrieving media collected for The Cacophony
Project.

Project | cacophony-api [![Status](https://api.travis-ci.org/TheCacophonyProject/cacophony-api.svg)](https://travis-ci.org/TheCacophonyProject/cacophony-api)
---|---
Platform | Linux
Requires | <none>
Previous names | Full Noise
Licence | [Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.en.html)

## Instructions

Download and install the latest release from [Github](https://github.com/TheCacophonyProject/cacophony-api/releases). We recommend you use our web application, [cacophony-browse](https://github.com/TheCacophonyProject/cacophony-browse/releases), to connect to this server.


## Development instructions

For development and testing purposes it is easiest to run
cacophony-api using Docker. To do this:

* Ensure your user account is set up to run commands as root using `sudo`.
* Ensure the Docker is installed (`sudo apt install docker.io` and docker-compose (https://docs.docker.com/compose/install/) on
  Ubuntu)
* Run either `npm run dev` (if npm is installed) or `docker-compose build && docker-compose up --force-recreate`.

This will build and then run a Docker container which includes all the services needed to run the server.

Once the container is running, you can start a bash session inside
the container with `npm run dev:bash` or `docker-compose exec server bash`.

To start psql to query the database in base use the alias `psqltest`


### Running the tests

The Cacophony API server has two functional test suites.   

The current tests are currently being rewritten using Cypress (typescript).
There is also a legacy set of test in python.   

Currently both sets of tests need to be run. 

#### Running the cypress tests

See [Cypress Tests](test-cypress/README.md) for details on running the cypress tests.

#### Running the python tests

The Cacophony API server has a comprehensive function test suite. This
requires Python 3.

To set-up for the tests:

* Create a virtualenv using your preferred method. Ensure that the
  virtualenv using Python 3. One approach way to create a virtualenv
  is: `python3 -m venv /path/to/venvs/cacophony-api-tests`. You may
  also want to consider [virtualenvwrapper](https://virtualenvwrapper.readthedocs.io/en/latest/).
* Activate the virtualenv. For example:
  `source /path/to/venvs/cacophony-api-tests/bin/activate`
* `cd test`
* Install dependencies: `pip install -r requirements.txt`

To run the tests:

* Start the API server as described above.
* Activate your virtualenv.
* `cd test`
* Run the tests with: `pytest -s`

### API Documentation

API documentation can be generated by running `npm run apidoc`. The
resulting documentation ends up in the `apidoc` directory.

The API server also serves up the generated API documentation at it's
root URL.

### Database Migrations

These are run automatically when you start the server.

To create a new database migration file: `npm run new-migration <name>`

### Docker base image
To make the project build fast on our build servers (and your computer) we use a base docker image that contains nodejs, postgis, minio and most of our js dependencies.   The code for building this server is in the folder `docker-base`

### Releases
Releases are created using travis and git and saved [on Github](https://github.com/TheCacophonyProject/cacophony-api/releases).   Follow our [release instructions](https://docs.cacophony.org.nz/home/creating-releases) to create a new release.
