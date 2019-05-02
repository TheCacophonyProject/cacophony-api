class TestException(Exception):
    def __init__(self, *args, **kwargs):
        Exception.__init__(self, *args, **kwargs)


class AuthenticationError(Exception):
    def __init__(self, *args, **kwargs):
        Exception.__init__(self, *args, **kwargs)


class AuthorizationError(Exception):
    def __init__(self, *args, **kwargs):
        Exception.__init__(self, *args, **kwargs)


class UnprocessableError(Exception):
    def __init__(self, *args, **kwargs):
        Exception.__init__(self, *args, **kwargs)


def raise_specific_exception(response):
    if response.status_code == 401:
        raise AuthenticationError(response.text)
    if response.status_code == 403:
        raise AuthorizationError(response.text)
    if response.status_code == 422:
        raise UnprocessableError(response.text)
    response.raise_for_status()
