import sys
sys.path.insert(0, '.')

from dash_app.app import app

app.server.config['PROPAGATE_EXCEPTIONS'] = True
app.server.config['TESTING'] = True

print('Callbacks:', len(app._callback_list))
for cb in app._callback_list:
    print(' ', cb.get('outputs', cb.get('output', '?')))

payload = {
    'output': 'summary-row.children,tab-content.children',
    'outputs': [{'id': 'summary-row', 'property': 'children'}, {'id': 'tab-content', 'property': 'children'}],
    'inputs': [
        {'id': 'f-team', 'property': 'value', 'value': None},
        {'id': 'f-athlete', 'property': 'value', 'value': None},
        {'id': 'f-date', 'property': 'start_date', 'value': '2026-05-11'},
        {'id': 'f-date', 'property': 'end_date', 'value': '2026-06-08'},
        {'id': 'f-stype', 'property': 'value', 'value': None},
        {'id': 'f-role', 'property': 'value', 'value': 'coach'},
        {'id': 'tab-main', 'property': 'value', 'value': 'tab-load'},
    ],
    'changedPropIds': ['f-role.value'],
    'state': [{'id': 'drilldown-state', 'property': 'data', 'value': {'level': 0, 'filters': {}}}],
}

with app.server.test_client() as client:
    resp = client.post('/_dash-update-component', json=payload)
    print('Status:', resp.status_code)
    if resp.status_code != 200:
        print('Error:', resp.data[:500].decode('utf-8', errors='replace'))
    else:
        print('OK, data len:', len(resp.data))
