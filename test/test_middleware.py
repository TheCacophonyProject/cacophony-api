from urllib.parse import urljoin

import requests


class TestMiddleware:
    def test_invalid_json_body_in_post_returns_400_level_status(self, test_config):
        print("When I POST to a valid endpoint with a malformed JSON body")

        url = urljoin(test_config.api_url, "/api/v1/users")
        response = requests.post(url, data="{")
        print("  The response code should be 400 level")
        assert 400 <= response.status_code < 500

    def test_malformed_jwt_returns_400_level_status(self, test_config):
        print("When I make a request that requires auth with a malformed JWT")

        url = urljoin(test_config.api_url, "/api/v1/users")
        response = requests.patch(url, data="{}", headers={"Authorization": "NOT VALID"})
        print("  The response code should be 400 level")
        assert 400 <= response.status_code < 500

    def test_no_jwt_returns_401_status(self, test_config):
        print("When I make a request that requires auth with no JWT")

        url = urljoin(test_config.api_url, "/api/v1/users")
        response = requests.patch(url, data="{}")
        print("  The response code should be 401")
        assert response.status_code == 401
