"""
pytest fixtures defined in conftest.py are automatically loaded and
made available for use within tests.
"""

import pytest

from helper import Helper


@pytest.fixture(scope='module')
def helper():
    return Helper()
