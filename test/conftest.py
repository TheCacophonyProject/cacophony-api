"""
pytest fixtures defined in conftest.py are automatically loaded and
made available for use within tests.
"""

import pytest

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
