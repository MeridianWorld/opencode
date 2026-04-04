import subprocess
import time
import os
import urllib.request
import signal

base_dir = r"D:\github_repo\opencode\opencode-context-kanban"
backend_dir = os.path.join(base_dir, "backend")
frontend_dir = os.path.join(base_dir, "frontend")

print("Starting backend...")
b_proc = subprocess.Popen(
    ["python", "main.py"],
    cwd=backend_dir,
    stdout=open(os.path.join(base_dir, "backend.log"), "w"),
    stderr=subprocess.STDOUT,
)

print("Starting frontend...")
f_proc = subprocess.Popen(
    ["npm", "run", "dev"],
    cwd=frontend_dir,
    shell=True,
    stdout=open(os.path.join(base_dir, "frontend.log"), "w"),
    stderr=subprocess.STDOUT,
)

print("Waiting for servers to start (10 seconds)...")
time.sleep(10)


def check_url(url, name):
    try:
        urllib.request.urlopen(url).getcode()
        print(f"[{name}] is UP!")
    except Exception as e:
        print(f"[{name}] is DOWN: {e}")


check_url("http://127.0.0.1:5175", "Frontend")
check_url("http://localhost:8000/docs", "Backend")

try:
    print("\nRunning verification script...")
    verify = subprocess.run(
        ["node", "verify.mjs"], cwd=base_dir, capture_output=True, text=True
    )
    print(verify.stdout)
    if verify.stderr:
        print("Error output from verify:", verify.stderr)
finally:
    print("Stopping servers...")
    b_proc.terminate()
    try:
        os.kill(f_proc.pid, signal.SIGTERM)
    except:
        pass
