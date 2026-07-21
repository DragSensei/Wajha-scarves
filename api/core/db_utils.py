from sqlalchemy import event
from sqlalchemy.engine import Engine
from flask import g, has_request_context

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    # ponytail: event listener to count database queries per request for testing and optimization assertions
    if has_request_context():
        if not hasattr(g, 'query_count'):
            g.query_count = 0
        g.query_count += 1

def get_query_count() -> int:
    """Returns the query count for the current request context, or 0 if not in a request context."""
    if has_request_context():
        return getattr(g, 'query_count', 0)
    return 0

def reset_query_count():
    """Resets the query count for the current request context."""
    if has_request_context():
        g.query_count = 0
