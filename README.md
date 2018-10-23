# cacophony-api

[![Status](https://api.travis-ci.org/TheCacophonyProject/cacophony-api.svg)](https://travis-ci.org/TheCacophonyProject/cacophony-api)

cacophony-api is a Node server that provides an REST API server for
uploading, processing and retrieving media collected for the Cacophony
Project. This server used to be known as "Full_Noise".

## Running the server

For development and testing purposes it is easiest to run
cacophony-api using Docker. To do this:

* Ensure your user account is set up to run commands as root using `sudo`.
* Ensure the Docker is installed (`sudo apt install docker.io` on
  Ubuntu)
* Run cacophony-api using `./run`

This will build a Docker container which includes all the services
that cacophony-api relies on and then runs the container. The end
result is a fully functioning API server. The container name is
"cacophony-api".

The first time `./run` is used will be somewhat slow as dependencies
are downloaded. Future executions are quite fast as Docker caches the
images it creates.

Once the container is running, you can start a bash session inside
the container with `docker exec -it cacophony-api bash`.  You can then use
psql to query the database `sudo -i -u postgres psql cacophonytest`

## Running the tests

The Cacophony API server has a comprehensive function test suite. This
requires Python 3.

To run the tests, you need to do these steps once:

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
* Activate the virtualenv created earlier.
* `cd test`
* Run the tests with: `pytest -s`

## API Documentation

API documentation can be generated by running `npm run apidoc`. The
resulting documentation ends up in the `apidoc` directory.

The API server also serves up the generated API documentation at it's
root URL.

## License

This project is licensed under the Affero General Public License
(https://www.gnu.org/licenses/agpl-3.0.en.html).
