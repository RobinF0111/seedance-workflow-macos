"""Loads the original V4.3.5 server code without changing workflow behavior."""
from __future__ import annotations

import marshal
import sys
from pathlib import Path


_code_path = Path(__file__).with_name("server.code")
exec(marshal.loads(_code_path.read_bytes()), globals(), globals())

# PyInstaller places macOS bundle resources under Contents/Frameworks. Point the
# unchanged V4.3.5 handlers at those resources and keep external Skill updates.
if getattr(sys, "frozen", False):
    _resources = Path(getattr(sys, "_MEIPASS"))
    _executable = Path(sys.executable).resolve()
    STATIC_DIR = _resources / "static"
    SKILL_ROOTS = (
        _executable.parent / "skills",
        _executable.parents[3] / "skills",
        _resources / "skills",
    )
