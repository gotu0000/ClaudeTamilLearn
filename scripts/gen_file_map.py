#!/usr/bin/env python3
"""Generate docs/FILE_MAP.md from JSDoc headers in src/**/*.{js,jsx}.

Each source file must start with a /** ... */ block containing these tags:
  @file, @module, @description, @exports, @depends, @connects

Usage:
  python3 scripts/gen_file_map.py --write   # regenerate docs/FILE_MAP.md
  python3 scripts/gen_file_map.py --check   # exit 1 if out of sync (prints diff)
"""
from __future__ import annotations

import argparse
import difflib
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"
OUT_PATH = REPO_ROOT / "docs" / "FILE_MAP.md"

REQUIRED_TAGS = ("file", "module", "description", "exports", "depends", "connects")

HEADER_RE = re.compile(r"/\*\*(.*?)\*/", re.DOTALL)
TAG_RE = re.compile(r"^\s*\*?\s*@(\w+)\b(.*)$")


def find_source_files() -> list[Path]:
    patterns = ("*.js", "*.jsx")
    files: list[Path] = []
    for pat in patterns:
        files.extend(SRC_DIR.rglob(pat))
    files = [f for f in files if "node_modules" not in f.parts]
    return sorted(files)


def parse_header(path: Path) -> dict[str, str | list[str]]:
    text = path.read_text(encoding="utf-8")
    m = HEADER_RE.search(text[:4000])
    if not m:
        raise ValueError(f"{path.relative_to(REPO_ROOT)}: missing /** ... */ header")
    body = m.group(1)

    tags: dict[str, list[str]] = {}
    current: str | None = None
    for raw in body.splitlines():
        tag_match = TAG_RE.match(raw)
        if tag_match:
            current = tag_match.group(1)
            rest = tag_match.group(2).strip()
            tags[current] = [rest] if rest else []
        elif current is not None:
            cleaned = re.sub(r"^\s*\*\s?", "", raw).rstrip()
            if cleaned:
                tags[current].append(cleaned)

    missing = [t for t in REQUIRED_TAGS if t not in tags]
    if missing:
        raise ValueError(
            f"{path.relative_to(REPO_ROOT)}: header missing required tag(s): "
            f"{', '.join('@' + t for t in missing)}"
        )

    result: dict[str, str | list[str]] = {}
    for tag, lines in tags.items():
        if tag in ("exports",):
            items = [re.sub(r"^\s*-\s*", "", ln).strip() for ln in lines if ln.strip()]
            result[tag] = [i for i in items if i]
        else:
            joined = " ".join(ln.strip() for ln in lines if ln.strip())
            result[tag] = joined.strip()
    return result


def render_map(entries: list[tuple[Path, dict]]) -> str:
    lines: list[str] = []
    lines.append("# Source File Map")
    lines.append("")
    lines.append(
        "_Auto-generated from JSDoc headers in `src/`. "
        "Run `python3 scripts/gen_file_map.py --write` after editing any source file._"
    )
    lines.append("")
    for path, tags in entries:
        rel = path.relative_to(REPO_ROOT).as_posix()
        lines.append(f"## `{rel}`")
        lines.append("")
        lines.append(f"**Module:** {tags['module']}")
        lines.append("")
        lines.append(f"**Description:** {tags['description']}")
        lines.append("")
        exports = tags["exports"]
        if isinstance(exports, list) and exports and exports != ["(none)"]:
            lines.append("**Exports:**")
            lines.append("")
            for item in exports:
                lines.append(f"- {item}")
            lines.append("")
        else:
            lines.append("**Exports:** (none)")
            lines.append("")
        lines.append(f"**Depends on:** {tags['depends']}")
        lines.append("")
        lines.append(f"**Connects:** {tags['connects']}")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def build_map() -> str:
    files = find_source_files()
    if not files:
        raise ValueError(f"No source files found under {SRC_DIR}")
    entries = [(f, parse_header(f)) for f in files]
    return render_map(entries)


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--write", action="store_true", help="Write the map (default)")
    group.add_argument("--check", action="store_true", help="Fail if map is out of sync")
    args = parser.parse_args()

    try:
        new_content = build_map()
    except ValueError as e:
        print(f"gen_file_map: {e}", file=sys.stderr)
        return 2

    if args.check:
        existing = OUT_PATH.read_text(encoding="utf-8") if OUT_PATH.exists() else ""
        if existing == new_content:
            return 0
        diff = difflib.unified_diff(
            existing.splitlines(keepends=True),
            new_content.splitlines(keepends=True),
            fromfile=str(OUT_PATH.relative_to(REPO_ROOT)) + " (on disk)",
            tofile=str(OUT_PATH.relative_to(REPO_ROOT)) + " (expected)",
        )
        sys.stderr.write(
            "gen_file_map: docs/FILE_MAP.md is out of sync with src/ JSDoc headers.\n"
            "Run: python3 scripts/gen_file_map.py --write && git add docs/FILE_MAP.md\n\n"
        )
        sys.stderr.writelines(diff)
        return 1

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(new_content, encoding="utf-8")
    print(f"gen_file_map: wrote {OUT_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
