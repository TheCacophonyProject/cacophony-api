import pytest

# Get pytest to generate detail assert failures in our test helper
# modules.
pytest.register_assert_rewrite("test.helper", "test.testdevice", "test.testuser", "test.testrecording")
