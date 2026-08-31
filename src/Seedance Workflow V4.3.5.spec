from pathlib import Path

root = Path(SPEC).resolve().parent
project_root = root.parent
a = Analysis(
    [str(root / "desktop_app.py")],
    pathex=[str(root)],
    binaries=[],
    datas=[
        (str(root / "static"), "static"),
        (str(project_root / "skills"), "skills"),
        (str(root / "server.code"), "."),
        (str(root / "contracts" / "proposed-qa-contract.json"), "."),
        (str(root / "contracts" / "proposed-repair-contract.json"), "."),
    ],
    hiddenimports=[
        "base64", "concurrent.futures", "copy", "ctypes", "ctypes.wintypes", "difflib", "getpass",
        "hashlib", "http.client", "http.server", "multiprocessing", "re", "socket",
        "ssl", "typing", "urllib.error", "urllib.parse", "urllib.request", "uuid",
        "xmlrpc.client",
    ],
    hookspath=[], runtime_hooks=[], excludes=[], noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name="Seedance Workflow V4.3.5", debug=False, bootloader_ignore_signals=False, strip=False, upx=False, console=False, target_arch="arm64")
coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, upx_exclude=[], name="Seedance Workflow V4.3.5")
app = BUNDLE(coll, name="Seedance Workflow V4.3.5.app", icon=None, bundle_identifier="com.seedance.workflow.v435", info_plist={"CFBundleDisplayName": "Seedance Workflow V4.3.5", "CFBundleShortVersionString": "4.3.5", "NSHighResolutionCapable": True, "LSMinimumSystemVersion": "11.0"})
