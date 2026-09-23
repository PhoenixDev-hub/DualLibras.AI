import json
from urllib.request import urlopen

with urlopen('http://127.0.0.1:4000/ready', timeout=3) as response:
    assert json.load(response)['status'] == 'ready'
with urlopen('http://127.0.0.1:5455/health', timeout=3) as response:
    assert json.load(response)['authorization_configured']
