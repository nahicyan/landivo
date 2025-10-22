#!/usr/bin/env python3
import sys, json, argparse, os, shutil, subprocess, tempfile
from pathlib import Path
import pandas as pd
from mailmerge import MailMerge
from concurrent.futures import ThreadPoolExecutor, as_completed

# --- helpers: log to backend terminal (Node prints our stderr) --------------
def log(msg: str):
    print(msg, file=sys.stderr, flush=True)

# --- PDF merger compatibility (pypdf or PyPDF2) -----------------------------
PdfMerger = None
try:
    from pypdf import PdfMerger as _PdfMerger   # pypdf >= 3.0
    PdfMerger = _PdfMerger
except Exception:
    try:
        from PyPDF2 import PdfMerger as _PdfMerger  # PyPDF2 >= 2.0
        PdfMerger = _PdfMerger
    except Exception:
        try:
            from PyPDF2 import PdfFileMerger as _PdfMerger  # very old PyPDF2
            PdfMerger = _PdfMerger
        except Exception as e:
            raise ImportError(
                "No PdfMerger found. Install pypdf or PyPDF2:\n"
                "  pip install --upgrade pypdf\n"
                "or\n  pip install --upgrade PyPDF2"
            )

def load_df(path):
    low = path.lower()
    if low.endswith(".csv"):
        return pd.read_csv(path, dtype=str).fillna("")
    return pd.read_excel(path, dtype=str).fillna("")

def find_soffice():
    which = shutil.which("soffice") or shutil.which("libreoffice")
    if which:
        return which
    candidates = [
        # Linux
        "/usr/bin/soffice",
        "/usr/local/bin/soffice",
        "/usr/lib/libreoffice/program/soffice",
        #"/snap/bin/libreoffice",
        # macOS
        #"/Applications/LibreOffice.app/Contents/MacOS/soffice",
        # Windows
        #r"C:\Program Files\LibreOffice\program\soffice.exe",
        #r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def convert_docx_to_pdf(docx_path, out_pdf_path, profile_dir=None):
    soffice = find_soffice()
    if not soffice:
        raise RuntimeError(
            "LibreOffice not found (soffice). Please install LibreOffice and ensure it's in PATH."
        )

    out_dir = str(Path(out_pdf_path).parent.resolve())
    cmd = [soffice, "--headless", "--norestore", "--invisible"]

    if profile_dir:
        uri = Path(profile_dir).resolve().as_uri()
        cmd.append(f"-env:UserInstallation={uri}")

    cmd += ["--convert-to", "pdf:writer_pdf_Export:IsSkipEmptyPages=true",
            "--outdir", out_dir, str(docx_path)]

    subprocess.run(cmd, check=True)

    produced = Path(out_dir) / (Path(docx_path).stem + ".pdf")
    if produced.resolve() != Path(out_pdf_path).resolve():
        shutil.move(str(produced), str(out_pdf_path))

def chunk_iterable(items, size):
    for i in range(0, len(items), size):
        yield items[i:i+size]

def make_chunk_docx(template_path, records, dest_docx):
    with MailMerge(template_path) as doc:
        doc.merge_pages(records)
        doc.write(dest_docx)

# ---- structured events on STDOUT (parsed by Node) --------------------------
def emit_meta(total):
    print(json.dumps({"type": "meta", "total": int(total)}), flush=True)

def emit_progress(processed, total, stage="converting"):
    pct = int((processed * 100) / total) if total else 0
    print(json.dumps({
        "type": "progress",
        "processed": int(processed),
        "total": int(total),
        "percent": pct,
        "stage": stage
    }), flush=True)
    # mirror a readable line to STDERR so it appears in the backend terminal
    log(f"[pdf-merge] progress: {processed}/{total} rows ({pct}%) stage={stage}")

def main(template_path, data_path, output_pdf_path, mapping_json_path,
         chunk_size, gen_workers, conv_workers):
    workdir = None
    try:
        log("[pdf-merge] starting generator")
        log(f"[pdf-merge] options: chunk_size={chunk_size}, gen_workers={gen_workers}, conv_workers={conv_workers}")

        if not template_path.lower().endswith(".docx"):
            raise ValueError("Template must be a .docx file")

        with open(mapping_json_path, "r", encoding="utf-8") as f:
            mapping = json.load(f)
        log(f"[pdf-merge] mapping variables: {len(mapping)}")

        df = load_df(data_path)
        log(f"[pdf-merge] data loaded: {len(df)} rows")

        # Check if ALL mappings are custom values (no CSV columns used)
        all_custom = all(
            isinstance(cfg, dict) and cfg.get("type") == "custom"
            for cfg in mapping.values()
        )

        # Build records list with support for CSV columns AND custom values
        records = []
        csv_mappings = 0
        custom_mappings = 0
        
        if all_custom:
            # If ALL mappings are custom values, create only ONE record
            log("[pdf-merge] All mappings are custom values - generating single page")
            rec = {}
            for tvar, map_config in mapping.items():
                map_value = map_config.get("value", "")
                rec[tvar] = str(map_value)
                custom_mappings += 1
            records.append(rec)
        else:
            # If there are CSV mappings, iterate through all rows
            for _, row in df.iterrows():
                rec = {}
                for tvar, map_config in mapping.items():
                    # Handle both old format (string) and new format (object)
                    if isinstance(map_config, dict):
                        map_type = map_config.get("type", "csv")
                        map_value = map_config.get("value", "")
                        
                        if map_type == "custom":
                            # Use the custom value directly (same for all rows)
                            rec[tvar] = str(map_value)
                            custom_mappings += 1 if _ == 0 else 0  # count once
                        else:
                            # Use CSV column value (varies per row)
                            rec[tvar] = str(row.get(map_value, "") or "")
                            csv_mappings += 1 if _ == 0 else 0  # count once
                    else:
                        # Old format: direct column name (backward compatibility)
                        rec[tvar] = str(row.get(map_config, "") or "")
                        csv_mappings += 1 if _ == 0 else 0  # count once
                records.append(rec)

        log(f"[pdf-merge] mapping breakdown: {csv_mappings} CSV columns, {custom_mappings} custom values")

        total = len(records)
        if total == 0:
            raise ValueError("No records to generate")

        emit_meta(total)
        log(f"[pdf-merge] total rows to process: {total}")

        # Workdir for chunks
        workdir = Path(tempfile.mkdtemp(prefix="merge_chunks_"))
        workdir.mkdir(parents=True, exist_ok=True)

        # Split into chunks
        chunks = list(chunk_iterable(records, chunk_size))
        chunk_sizes = [len(c) for c in chunks]
        log(f"[pdf-merge] chunking: {len(chunks)} chunks -> sizes={chunk_sizes}")

        # 1) CREATE chunk DOCXs
        chunk_docx = []

        def _gen(idx_chunk):
            i, chunk = idx_chunk
            dpath = workdir / f"chunk_{i:04d}.docx"
            make_chunk_docx(template_path, chunk, dpath)
            return dpath

        indexed = list(enumerate(chunks, start=1))

        if gen_workers > 1:
            with ThreadPoolExecutor(max_workers=gen_workers) as ex:
                futures = [ex.submit(_gen, pair) for pair in indexed]
                for fut in as_completed(futures):
                    dpath = fut.result()
                    chunk_docx.append(dpath)
        else:
            for pair in indexed:
                dpath = _gen(pair)
                chunk_docx.append(dpath)

        # Keep stable order (chunk_0001, chunk_0002, ...)
        chunk_docx = sorted(chunk_docx, key=lambda p: p.name)
        chunk_pdfs = [d.with_suffix(".pdf") for d in chunk_docx]

        # 2) CONVERT chunk DOCXs → PDFs, while emitting progress after each chunk
        processed = 0
        log("[pdf-merge] starting conversion...")

        def _convert(i, dpath):
            profile_dir = tempfile.mkdtemp(prefix=f"lo_profile_{i:02d}_")
            try:
                convert_docx_to_pdf(dpath, dpath.with_suffix(".pdf"), profile_dir=profile_dir)
            finally:
                shutil.rmtree(profile_dir, ignore_errors=True)

        if conv_workers > 1:
            with ThreadPoolExecutor(max_workers=conv_workers) as ex:
                future_to_idx = {}
                for i, d in enumerate(chunk_docx):
                    fut = ex.submit(_convert, i, d)
                    future_to_idx[fut] = i
                for fut in as_completed(future_to_idx):
                    i = future_to_idx[fut]
                    fut.result()
                    processed += chunk_sizes[i]
                    emit_progress(processed, total, stage="converting")
        else:
            for i, d in enumerate(chunk_docx):
                _convert(i, d)
                processed += chunk_sizes[i]
                emit_progress(processed, total, stage="converting")

        # 3) MERGE PDFs → final output (progress is already at 100% rows)
        log("[pdf-merge] merging PDFs...")
        merger = PdfMerger()
        for pdf in chunk_pdfs:
            merger.append(str(pdf))
        merger.write(output_pdf_path)
        merger.close()

        # Count merge fields for stats
        with MailMerge(template_path) as doc:
            merge_fields = set(doc.get_merge_fields())

        log("[pdf-merge] done. writing success payload")
        print(json.dumps({
            "success": True,
            "page_count": total,
            "variables_found": len(merge_fields),
            "variables_mapped": len(mapping),
            "output_pdf": output_pdf_path
        }), flush=True)
        return 0
    except Exception as e:
        log(f"[pdf-merge] ERROR: {e}")
        print(json.dumps({"success": False, "error": str(e)}), flush=True)
        return 1
    finally:
        if workdir:
            shutil.rmtree(workdir, ignore_errors=True)
            log("[pdf-merge] cleaned temp workdir")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--template", required=True)
    p.add_argument("--data", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--mapping", required=True)
    p.add_argument("--chunk-size", type=int, default=200)
    p.add_argument("--gen-workers", type=int, default=max(1, (os.cpu_count() or 2)//2))
    p.add_argument("--conv-workers", type=int, default=max(1, (os.cpu_count() or 2)//2))
    args = p.parse_args()
    sys.exit(main(args.template, args.data, args.output, args.mapping,
                  args.chunk_size, args.gen_workers, args.conv_workers))