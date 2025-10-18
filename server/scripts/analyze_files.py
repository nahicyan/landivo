#!/usr/bin/env python3
"""
Fast analyzer for DOCX + CSV/XLSX.

- Runs three tasks in parallel:
  1) Read real Mail Merge fields
  2) Scan document.xml for <<tokens>>
  3) Read headers from CSV/XLSX (nrows=0)

- Supports --timeout (seconds). If a task exceeds the timeout, it is skipped and
  the analyzer continues with whatever finished on time.

Usage:
  analyze_files.py --template template.docx --data data.xlsx --timeout 60
"""
import sys, json, argparse, re, zipfile
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import pandas as pd
from mailmerge import MailMerge

def get_mergefields(docx_path: str):
    try:
        with MailMerge(docx_path) as doc:
            return sorted(list(doc.get_merge_fields()))
    except Exception as e:
        print(f"[analyze] mergefields error: {e}", file=sys.stderr)
        return []

def get_angle_bracket_tokens(docx_path: str):
    """Fallback: scan raw document.xml for <<var>> tokens."""
    try:
        with zipfile.ZipFile(docx_path, 'r') as z:
            xml = z.read('word/document.xml').decode('utf-8', errors='ignore')
        # allow letters, digits, underscore, dot
        tokens = set(re.findall(r'<<\s*([A-Za-z0-9_\.]+)\s*>>', xml))
        return sorted(list(tokens))
    except Exception as e:
        print(f"[analyze] angle token scan error: {e}", file=sys.stderr)
        return []

def get_headers(data_path: str, sheet_name=None, sheet_index=None, encoding=None):
    """Read only header row; robust to CSV/XLS/XLSX."""
    low = data_path.lower()
    try:
        if low.endswith(".csv"):
            # try fast path first
            if encoding:
                df = pd.read_csv(data_path, nrows=0, dtype=str, encoding=encoding)
            else:
                try:
                    df = pd.read_csv(data_path, nrows=0, dtype=str)
                except Exception:
                    # fallback: let pandas sniff delimiter
                    df = pd.read_csv(data_path, nrows=0, dtype=str, sep=None, engine="python")
        else:
            # prefer explicit sheet selection if provided
            if sheet_name is not None:
                df = pd.read_excel(data_path, nrows=0, dtype=str, sheet_name=sheet_name)
            elif sheet_index is not None:
                df = pd.read_excel(data_path, nrows=0, dtype=str, sheet_name=sheet_index)
            else:
                df = pd.read_excel(data_path, nrows=0, dtype=str)  # default first sheet
        return [str(c) for c in df.columns.tolist()]
    except Exception as e:
        print(f"[analyze] header read error: {e}", file=sys.stderr)
        return []

def main(template_path: str, data_path: str, timeout_s: int, sheet_name, sheet_index, encoding):
    try:
        if not template_path.lower().endswith(".docx"):
            raise ValueError("Template must be a .docx file")

        # Run template + header tasks in parallel
        with ThreadPoolExecutor(max_workers=3) as pool:
            f_merge = pool.submit(get_mergefields, template_path)
            f_angle = pool.submit(get_angle_bracket_tokens, template_path)
            f_headr = pool.submit(get_headers, data_path, sheet_name, sheet_index, encoding)

            mergefields, angle_tokens, headers = [], [], []

            # Each task gets up to timeout_s; if any times out, we proceed without it.
            try:
                mergefields = f_merge.result(timeout=timeout_s)
            except TimeoutError:
                print("[analyze] mergefields timed out", file=sys.stderr)
            try:
                angle_tokens = f_angle.result(timeout=timeout_s)
            except TimeoutError:
                print("[analyze] token scan timed out", file=sys.stderr)
            try:
                headers = f_headr.result(timeout=timeout_s)
            except TimeoutError:
                print("[analyze] header read timed out", file=sys.stderr)

        # Prefer real Mail Merge fields; otherwise use <<tokens>>
        template_vars = mergefields if mergefields else angle_tokens
        source = "mergefield" if mergefields else ("angle_tokens" if angle_tokens else "none")
        notes = ""
        if not mergefields and angle_tokens:
            notes = "Found only <<var>> tokens. For generation, please convert to real Mail Merge fields."

        out = {
            "success": True,
            "template_variables": template_vars,
            "csv_headers": headers,
            "template_source": source,
            "notes": notes
        }
        print(json.dumps(out))
        return 0

    except Exception as e:
        err = {"success": False, "error": str(e)}
        print(json.dumps(err))
        return 1

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--template", required=True, help="Path to DOCX template")
    p.add_argument("--data", required=True, help="Path to CSV or XLSX")
    p.add_argument("--timeout", type=int, default=30, help="Per-task timeout in seconds (default: 30)")
    p.add_argument("--sheet-name", default=None, help="Excel sheet name (optional)")
    p.add_argument("--sheet-index", type=int, default=None, help="Excel sheet index (0-based, optional)")
    p.add_argument("--encoding", default=None, help="CSV encoding (e.g., utf-8, windows-1252)")
    args = p.parse_args()

    sys.exit(main(
        args.template,
        args.data,
        args.timeout,
        args.sheet_name,
        args.sheet_index,
        args.encoding
    ))
