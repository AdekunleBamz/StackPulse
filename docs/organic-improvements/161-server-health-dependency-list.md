# Server health dependency list

Health responses should distinguish API, database, websocket, and indexer
dependencies so incidents do not collapse into a single generic failure.
