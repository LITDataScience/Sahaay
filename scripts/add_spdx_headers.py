import os
import sys
from pathlib import Path

CONFIG_FILE = Path(__file__).resolve().parents[1] / "legal_config.json"

# SPDX-Header-Start
# SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
# © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
# SPDX-Header-End

"""Utility to insert SPDX license headers across the repository."""

HEADER_BOUNDARY_START = "SPDX-Header-Start"
HEADER_BOUNDARY_END = "SPDX-Header-End"



def read_config():
    import json
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def should_skip(path: Path, exclude_patterns):
    from fnmatch import fnmatch
    path_str = str(path).replace("\\", "/")
    for pat in exclude_patterns:
        if fnmatch(path_str, pat) or f"/{pat}/" in path_str:
            return True
    parts = path.parts
    if any(part in {".git", "node_modules", ".venv", "dist", "build"} for part in parts):
        return True
    return False


essential_shebang_exts = {".sh", ".py"}


DEFAULT_HEADER_COMMENT_PREFIX = {
    ".py": "# ",
    ".sh": "# ",
    ".ts": "// ",
    ".tsx": "// ",
    ".js": "// ",
    ".jsx": "// ",
    ".md": "<!-- ",
}


def format_header(ext: str, header_text: str) -> str:
    if ext == ".md":
        return f"<!-- {HEADER_BOUNDARY_START} -->\n{header_text}\n<!-- {HEADER_BOUNDARY_END} -->\n\n"
    prefix = DEFAULT_HEADER_COMMENT_PREFIX.get(ext, "# ")
    lines = header_text.splitlines()
    commented = [f"{prefix}{line}" if line else prefix.rstrip() for line in lines]
    start = f"{prefix}{HEADER_BOUNDARY_START}"
    end = f"{prefix}{HEADER_BOUNDARY_END}"
    return "\n".join([start, *commented, end, ""]) + "\n"


def has_header(content: str) -> bool:
    return HEADER_BOUNDARY_START in content and HEADER_BOUNDARY_END in content


def insert_or_replace_header(path: Path, header_block: str):
    text = path.read_text(encoding="utf-8", errors="ignore")
    if has_header(text):
        # Replace existing block
        import re
        pattern = re.compile(rf".*{HEADER_BOUNDARY_START}.*[\s\S]*?{HEADER_BOUNDARY_END}.*\n?", re.MULTILINE)
        new_text = re.sub(pattern, header_block, text, count=1)
    else:
        # Preserve shebang if present
        if text.startswith("#!/"):
            first_newline = text.find("\n")
            if first_newline != -1:
                new_text = text[: first_newline + 1] + header_block + text[first_newline + 1 :]
            else:
                new_text = text + "\n" + header_block
        else:
            new_text = header_block + text
    path.write_text(new_text, encoding="utf-8")


def main(root: Path):
    cfg = read_config()
    include_exts = set(cfg.get("includeExtensions", []))
    exclude_patterns = cfg.get("excludePaths", [])
    header_text = cfg.get("headerTemplate", "SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary")

    count = 0
    for dirpath, dirnames, filenames in os.walk(root):
        # prune directories
        dirnames[:] = [d for d in dirnames if d not in {".git", "node_modules", ".venv", "dist", "build"}]
        for filename in filenames:
            p = Path(dirpath) / filename
            if should_skip(p, exclude_patterns):
                continue
            ext = p.suffix
            if include_exts and ext not in include_exts:
                continue
            header_block = format_header(ext, header_text)
            try:
                insert_or_replace_header(p, header_block)
                count += 1
            except Exception as e:
                print(f"WARN: failed to update {p}: {e}", file=sys.stderr)
    print(f"Updated headers in {count} files.")


if __name__ == "__main__":
    main(Path(__file__).resolve().parents[1])

