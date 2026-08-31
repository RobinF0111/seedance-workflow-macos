from __future__ import annotations

import json
import logging
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

import server as workflow


APP_TITLE = "Seedance Workflow V4.3.5"


def app_directory() -> Path:
    if getattr(sys, "frozen", False):
        executable = Path(sys.executable).resolve()
        return executable.parents[3] if executable.parent.name == "MacOS" else executable.parent
    return Path(__file__).resolve().parent


def configure_logging() -> Path:
    candidates = (
        app_directory() / "Seedance Workflow.log",
        Path.home() / "Library" / "Logs" / "Seedance Workflow V4.3.5.log",
        Path(tempfile.gettempdir()) / "Seedance Workflow V4.3.5.log",
    )
    for path in candidates:
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            logging.basicConfig(filename=path, level=logging.INFO, encoding="utf-8", format="%(asctime)s %(levelname)s %(message)s", force=True)
            return path
        except OSError:
            pass
    return candidates[-1]


def browser_command() -> str | None:
    candidates = (
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    )
    return next((p for p in candidates if Path(p).is_file()), None)


def open_app_window(url: str) -> tuple[subprocess.Popen[bytes] | None, str | None]:
    browser = browser_command()
    if not browser:
        webbrowser.open(url, new=1)
        return None, None
    profile = tempfile.mkdtemp(prefix="seedance-workflow-v435-macos-")
    process = subprocess.Popen([browser, f"--app={url}", f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check", "--disable-background-mode", "--disable-extensions"])
    return process, profile


def start_local_server():
    server_class = getattr(workflow, "ExclusiveThreadingHTTPServer", workflow.ThreadingHTTPServer)
    server = server_class(("127.0.0.1", 0), workflow.WorkflowHandler)
    thread = threading.Thread(target=server.serve_forever, name="seedance-local-api", daemon=True)
    thread.start()
    return server, thread, f"http://127.0.0.1:{server.server_address[1]}/"


def main() -> int:
    log_path = configure_logging()
    local_server = None
    process = None
    profile = None
    try:
        local_server, _thread, url = start_local_server()
        for _ in range(60):
            try:
                with urllib.request.urlopen(url + "api/status", timeout=1) as response:
                    status = json.loads(response.read().decode("utf-8"))
                if response.status == 200:
                    break
            except Exception as error:
                if hasattr(error, "read"):
                    try:
                        logging.error("Status endpoint: %s", error.read().decode("utf-8", errors="replace"))
                    except Exception:
                        pass
                time.sleep(0.1)
        else:
            raise RuntimeError("本地工作流服务启动超时。")
        if "--smoke-test" in sys.argv:
            if status.get("version") != "4.3.5-shot-routing-recovery":
                raise RuntimeError(f"版本校验失败：{status.get('version')}")
            return 0
        process, profile = open_app_window(url)
        if process:
            process.wait()
        else:
            while True:
                time.sleep(1)
    except KeyboardInterrupt:
        return 0
    except Exception:
        logging.exception("Application startup failed")
        subprocess.run(["osascript", "-e", f'display alert "{APP_TITLE}" message "启动失败，请查看日志：{log_path}" as critical'], check=False)
        return 1
    finally:
        if local_server:
            local_server.shutdown()
            local_server.server_close()
        if profile:
            shutil.rmtree(profile, ignore_errors=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
