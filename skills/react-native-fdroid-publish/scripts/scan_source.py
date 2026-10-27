"""Runs fdroidserver's own source scanner over a directory.

Usage: python -I scan_source.py <build_dir> <out.json> [--scanignore a,b] [--scandelete c,d]

This is the function `fdroid build` / `fdroid scanner APPID` call on the
checked-out source after the recipe's init step; called directly because the
APPID route needs a git clone of the recipe's Repo.
"""
import argparse
import json
import logging
import sys

from fdroidserver import common, metadata, scanner

parser = argparse.ArgumentParser()
parser.add_argument("build_dir")
parser.add_argument("out")
parser.add_argument("--scanignore", default="")
parser.add_argument("--scandelete", default="")
args = parser.parse_args()

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s",
    handlers=[logging.FileHandler(args.out + ".log", mode="w", encoding="utf-8")],
)
ns = argparse.Namespace(json=True, verbose=False, refresh=True, exit_code=True, quiet=False)
common.options = ns
scanner.options = ns
if hasattr(common, "set_options"):
    common.set_options(ns)

build = metadata.Build()
build.scanignore = [p for p in args.scanignore.split(",") if p]
build.scandelete = [p for p in args.scandelete.split(",") if p]

store = scanner.MessageStore()
count = scanner.scan_source(args.build_dir, build, json_per_build=store)

result = {
    "fatal_count": count,
    "errors": store.errors,
    "warnings": store.warnings,
    "infos": store.infos,
}
with open(args.out, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=1)
print(f"fatal problems: {count}; errors {len(store.errors)}, warnings {len(store.warnings)}, infos {len(store.infos)}")
sys.exit(0)
