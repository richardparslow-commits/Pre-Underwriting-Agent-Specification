"""Public synthetic requests only. Never use against the live intake hostname."""
import argparse, datetime, json, subprocess, tempfile, time, uuid
from pathlib import Path

TARGET = 'https://quota-check.lifepolicypilot.blog/submit-case'
ORIGIN = 'https://synthetic.example.test'
p = argparse.ArgumentParser()
p.add_argument('--family', choices=['4', '6'], required=True)
p.add_argument('--label', required=True)
p.add_argument('--output', required=True)
a = p.parse_args()
# Keep each exhaustion sequence within one real 600-second database window.
remaining = 600 - time.time() % 600
if remaining < 20:
    time.sleep(remaining + 1)
checks = []
for i in range(12):
    with tempfile.TemporaryDirectory() as tmp:
        h = str(Path(tmp) / 'headers')
        args = ['curl', '-sS', '-' + a.family, '--connect-timeout', '8', '--max-time', '20',
                '--user-agent', 'Mozilla/5.0', '--request', 'POST', TARGET,
                '--header', 'Origin: ' + ORIGIN, '--header', 'Content-Type: application/json',
                '--header', 'Idempotency-Key: synthetic_' + uuid.uuid4().hex,
                '--header', 'X-Forwarded-For: 198.51.100.' + str(i + 1),
                '--header', 'X-Real-IP: 203.0.113.' + str(i + 1),
                '--data', '{}', '--dump-header', h, '--write-out', '\n%{http_code}']
        result = subprocess.run(args, capture_output=True, text=True, timeout=25)
        if result.returncode:
            checks.append({'attempt': i + 1, 'transport_failed': True})
            break
        body, status = result.stdout.rsplit('\n', 1)
        status = int(status)
        # Diagnostic marker is not forwarded by the real relay; pair with SQL counter readback.
        marker = 'x-lpp-isolated-counter-only: true' in Path(h).read_text().lower()
        expected = 422 if i < 10 else 429
        checks.append({'attempt': i + 1, 'status': status, 'expected': expected,
                       'backend_marker_forwarded': marker, 'passed': status == expected})
passed = len(checks) == 12 and all(c.get('passed', False) for c in checks)
report = {'label': a.label, 'address_family': a.family, 'target': TARGET,
          'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'passed': passed, 'requests': checks,
          'requires_database_counter_readback': True,
          'note': 'The real relay filters upstream diagnostic headers; database counter readback is required to establish quota evidence. Provider supplies client identity. No raw client IP, secret, or case payload is recorded.'}
Path(a.output).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
raise SystemExit(0 if passed else 1)
