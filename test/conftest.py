"""
pytest fixtures defined in conftest.py are automatically loaded and
made available for use within tests.
"""

import subprocess

import pytest
import os

from .helper import Helper
from .fileprocessingapi import FileProcessingAPI
from .testconfig import TestConfig


@pytest.fixture(scope="module")
def test_config():
    return TestConfig().load_config()


@pytest.fixture(scope="module")
def helper():
    return Helper()


@pytest.fixture(scope="module")
def file_processing(test_config):
    return FileProcessingAPI(test_config.fileprocessing_url)


def pytest_addoption(parser):
    parser.addoption(
        "--log-api-on-fail",
        action="store_true",
        default=False,
        help="show the log of the api server on faile",
    )


@pytest.hookimpl
def pytest_configure(config):
    if config.getoption("log_api_on_fail"):
        os.environ["LOG_API"] = "True"


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    "Include recent log output from the API server in the test failures"

    outcome = yield
    rep = outcome.get_result()

    if rep.when == "call" and rep.failed and "LOG_API" in os.environ:
        try:
            proc = subprocess.run(
                ["docker", "logs", "--tail", "50", "cacophony-api"],
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                check=False,  # this is allowed to fail (perhaps API server is not running in docker)
                universal_newlines=True,
            )
        except FileNotFoundError:
            return
        if proc.returncode == 0:
            rep.sections.append(("Recent API server logs", proc.stdout))
