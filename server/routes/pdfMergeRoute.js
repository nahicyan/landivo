// routes/pdfMergeRoute.js
import express from "express";
import multer from "multer";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import Redis from "ioredis";
import { spawnSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

// ---- Timeouts & defaults ----
const ANALYZE_TASK_TIMEOUT_SECS = Number(process.env.ANALYZE_TASK_TIMEOUT_SECS || 3600); // per-task in analyzer
const PY_ANALYZE_TIMEOUT_MS = Number(process.env.PY_ANALYZE_TIMEOUT_MS || 3600000); // Node->Py overall
const PY_GENERATE_TIMEOUT_MS = Number(process.env.PY_GENERATE_TIMEOUT_MS || 3600000); // Node->Py overall

const DEFAULT_CHUNK_SIZE = Number(process.env.MERGE_CHUNK_SIZE || 200);
const CPU_COUNT = os.cpus()?.length || 2;
const DEFAULT_GEN_WORKERS = Number(process.env.MERGE_GEN_WORKERS || Math.max(1, Math.floor(CPU_COUNT / 2)));
const DEFAULT_CONV_WORKERS = Number(process.env.MERGE_CONV_WORKERS || Math.max(1, Math.floor(CPU_COUNT / 2)));

const PROGRESS_TTL = Number(process.env.PROGRESS_TTL || 60 * 60); // 1 hour

// ---- Progress store: Redis (no-auth by default) with memory fallback ----
const memStore = new Map();

let redis = null;
try {
  if (process.env.REDIS_URL) {
    // e.g. redis://127.0.0.1:6379/0  (no password)
    redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 2 });
  } else {
    redis = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      db: Number(process.env.REDIS_DB || 0),
      maxRetriesPerRequest: 2,
    });
  }
  redis.on("error", (e) => {
    console.warn("[pdf-merge] Redis error:", e.message);
  });
} catch (e) {
  console.warn("[pdf-merge] Redis init failed, using memory store:", e.message);
  redis = null;
}

const progressKey = (id) => `pdfmerge:progress:${id}`;

async function setProgress(id, obj) {
  if (redis) {
    try {
      await redis.set(progressKey(id), JSON.stringify(obj), "EX", PROGRESS_TTL);
      return;
    } catch (e) {
      console.warn("[pdf-merge] Redis set failed, fallback to memory:", e.message);
    }
  }
  memStore.set(id, obj);
}

async function getProgress(id) {
  if (redis) {
    try {
      const s = await redis.get(progressKey(id));
      return s ? JSON.parse(s) : null;
    } catch (e) {
      console.warn("[pdf-merge] Redis get failed, fallback to memory:", e.message);
    }
  }
  return memStore.get(id) || null;
}

async function patchProgress(id, patch) {
  const cur = (await getProgress(id)) || {};
  const next = { ...cur, ...patch };
  await setProgress(id, next);
  return next;
}

async function delProgress(id) {
  if (redis) {
    try {
      await redis.del(progressKey(id));
    } catch {}
  } else {
    memStore.delete(id);
  }
}

function resolvePythonPath() {
  // Allow override
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;

  // Default per-OS
  if (process.platform === "win32") {
    return path.join(ROOT_DIR, "venv", "Scripts", "python.exe");
  }
  return "python3";
}

function checkPythonExists(pythonCmd) {
  // Absolute path? check file. Bare command? use `which`.
  if (path.isAbsolute(pythonCmd)) {
    return fs.existsSync(pythonCmd);
  }
  try {
    const out = spawnSync("which", [pythonCmd], { encoding: "utf8" });
    return out.status === 0 && out.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

const router = express.Router();

// Test
router.get("/test", (req, res) => {
  res.json({ success: true, message: "PDF Merge route is working!", timestamp: new Date().toISOString() });
});

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(ROOT_DIR, "uploads", "pdf-merge");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Run Python helper (NDJSON-capable)
function runPythonScript(pythonPath, scriptPath, args, env, serverRoot, timeoutMs = 300000, onJsonLine = null) {
  return new Promise((resolve, reject) => {
    console.log(`Starting Python process: ${pythonPath} ${scriptPath} ${args.join(" ")}`);
    const child = spawn(pythonPath, [scriptPath, ...args], { env, cwd: serverRoot });

    let buf = "";
    let err = "";
    let done = false;
    let lastStructured = null;

    const t = setTimeout(() => {
      if (!done) {
        console.error("Python process timeout - killing process");
        child.kill();
        reject(new Error(`Process timeout after ${timeoutMs / 1000} seconds`));
      }
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      const s = d.toString();
      buf += s;

      // NDJSON parse
      let lines = buf.split(/\r?\n/);
      buf = lines.pop(); // keep partial
      for (const line of lines) {
        const tline = line.trim();
        if (!tline) continue;
        try {
          const obj = JSON.parse(tline);
          if (typeof onJsonLine === "function") {
            try {
              // fire & forget—don’t block the stream
              Promise.resolve(onJsonLine(obj)).catch(() => {});
            } catch {}
          }
          if (Object.prototype.hasOwnProperty.call(obj, "success")) {
            lastStructured = obj;
          }
        } catch {
          /* ignore non-JSON lines */
        }
      }
    });

    child.stderr.on("data", (d) => {
      const s = d.toString();
      console.error("Python stderr:", s);
      err += s;
    });

    child.on("close", (code) => {
      done = true;
      clearTimeout(t);
      // Try to parse any final complete line left in buf
      const tail = buf.trim();
      if (tail) {
        try {
          const obj = JSON.parse(tail);
          if (typeof onJsonLine === "function") {
            try {
              Promise.resolve(onJsonLine(obj)).catch(() => {});
            } catch {}
          }
          if (Object.prototype.hasOwnProperty.call(obj, "success")) {
            lastStructured = obj;
          }
        } catch {
          /* ignore */
        }
      }

      console.log("Python process exited with code:", code);
      if (code === 0 && lastStructured) {
        resolve(lastStructured);
      } else if (lastStructured && lastStructured.success === false) {
        reject(new Error(lastStructured.error || "Python script failed"));
      } else {
        reject(new Error(err || `Python script exited with code ${code}`));
      }
    });

    child.on("error", (e) => {
      done = true;
      clearTimeout(t);
      console.error("Failed to start Python process:", e);
      reject(e);
    });
  });
}

// /analyze
router.post(
  "/analyze",
  upload.fields([
    { name: "template", maxCount: 1 },
    { name: "csv", maxCount: 1 }, // CSV or XLSX; field kept as 'csv'
  ]),
  async (req, res) => {
    let templatePath = null;
    let dataPath = null;

    try {
      if (!req.files || !req.files.template || !req.files.csv) {
        return res.status(400).json({ success: false, message: "Both DOCX template and CSV/XLSX file are required" });
      }

      templatePath = req.files.template[0].path;
      dataPath = req.files.csv[0].path;

      const serverRoot = ROOT_DIR;

      const isWin = process.platform === "win32";
      const pythonPath = resolvePythonPath();
      if (!checkPythonExists(pythonPath)) {
        return res.status(500).json({
          success: false,
          message: `Python not found: "${pythonPath}". Set PYTHON_BIN or install python3 in PATH.`,
        });
      }

      const scriptPath = path.join(ROOT_DIR, "scripts", "analyze_files.py");
      if (!fs.existsSync(scriptPath)) {
        return res.status(500).json({
          success: false,
          message: "Analysis script not found",
        });
      }

      const env = { ...process.env };
      if (process.platform === "win32") {
        const venvPath = path.join(serverRoot, "venv");
        const venvScriptsPath = path.join(venvPath, "Scripts");
        const venvLibPath = path.join(venvPath, "Lib", "site-packages");
        env.PATH = `${venvScriptsPath};${env.PATH}`;
        env.VIRTUAL_ENV = venvPath;
        env.PYTHONPATH = venvLibPath;
      }

      // Optional analyzer flags (sent as text fields in the same multipart form)
      const sheetName = typeof req.body.sheetName === "string" ? req.body.sheetName : null;
      const sheetIndex = Number.isFinite(Number(req.body.sheetIndex)) ? String(Number(req.body.sheetIndex)) : null;
      const encoding = typeof req.body.encoding === "string" ? req.body.encoding : null;
      const perTaskTimeout = String(ANALYZE_TASK_TIMEOUT_SECS);

      const args = ["--template", templatePath, "--data", dataPath, "--timeout", perTaskTimeout];
      if (sheetName) args.push("--sheet-name", sheetName);
      if (sheetIndex !== null) args.push("--sheet-index", sheetIndex);
      if (encoding) args.push("--encoding", encoding);

      const result = await runPythonScript(pythonPath, scriptPath, args, env, serverRoot, PY_ANALYZE_TIMEOUT_MS);

      // Clean up
      if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
      if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);

      return res.json({
        success: true,
        templateVariables: result.template_variables || [],
        csvHeaders: result.csv_headers || [],
        templateSource: result.template_source || "unknown",
        notes: result.notes || "",
      });
    } catch (error) {
      // Cleanup on error
      try {
        if (templatePath && fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
        if (dataPath && fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
      } catch {}

      return res.status(500).json({ success: false, message: "Failed to analyze files", error: error.message });
    }
  }
);

// /generate
router.post(
  "/generate",
  upload.fields([
    { name: "template", maxCount: 1 },
    { name: "csv", maxCount: 1 },
  ]),
  async (req, res) => {
    let templatePath = null;
    let dataPath = null;
    let mappingPath = null;

    try {
      if (!req.files || !req.files.template || !req.files.csv) {
        return res.status(400).json({ success: false, message: "Both DOCX template and CSV/XLSX file are required" });
      }

      templatePath = req.files.template[0].path;
      dataPath = req.files.csv[0].path;

      // progress: client-provided or auto-generate
      const progressId = typeof req.body.progressId === "string" && req.body.progressId.trim() ? req.body.progressId.trim() : `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // initialize progress store
      await setProgress(progressId, {
        processed: 0,
        total: 0,
        percent: 0,
        stage: "starting",
        updatedAt: Date.now(),
        done: false,
      });

      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};
      const outputFileName = `merged-${Date.now()}.pdf`;
      const outputPath = path.join(ROOT_DIR, "uploads", "pdf-merge", outputFileName);

      const serverRoot = ROOT_DIR;
      const pythonPath = resolvePythonPath();
      if (!checkPythonExists(pythonPath)) {
        return res.status(500).json({
          success: false,
          message: `Python not found: "${pythonPath}". Set PYTHON_BIN or install python3 in PATH.`,
        });
      }

      const scriptPath = path.join(ROOT_DIR, "scripts", "generate_merged_pdf.py");
      if (!fs.existsSync(scriptPath)) {
        return res.status(500).json({
          success: false,
          message: "Generation script not found",
        });
      }

      const env = { ...process.env };
      const venvPath = path.join(serverRoot, "venv");
      const venvScriptsPath = path.join(venvPath, "Scripts");
      const venvLibPath = path.join(venvPath, "Lib", "site-packages");
      env.PATH = `${venvScriptsPath};${env.PATH}`;
      env.VIRTUAL_ENV = venvPath;
      env.PYTHONPATH = venvLibPath;

      // Save mapping JSON
      mappingPath = path.join(ROOT_DIR, "uploads", "pdf-merge", `mapping-${Date.now()}.json`);
      fs.writeFileSync(mappingPath, JSON.stringify(mapping));

      // Tuning knobs (accept from form fields or fall back to env/defaults)
      const chunkSize = Math.max(1, Number.isFinite(Number(req.body.chunkSize)) ? Number(req.body.chunkSize) : DEFAULT_CHUNK_SIZE);
      const genWorkers = Math.max(1, Number.isFinite(Number(req.body.genWorkers)) ? Number(req.body.genWorkers) : DEFAULT_GEN_WORKERS);
      const convWorkers = Math.max(1, Number.isFinite(Number(req.body.convWorkers)) ? Number(req.body.convWorkers) : DEFAULT_CONV_WORKERS);

      const args = [
        "--template",
        templatePath,
        "--data",
        dataPath,
        "--output",
        outputPath,
        "--mapping",
        mappingPath,
        "--chunk-size",
        String(chunkSize),
        "--gen-workers",
        String(genWorkers),
        "--conv-workers",
        String(convWorkers),
      ];

      // Consume streaming NDJSON from Python to update progress store
      const onJsonLine = (obj) => {
        // fire & forget to avoid blocking stdout handler
        (async () => {
          const prev = (await getProgress(progressId)) || {};
          if (obj && obj.type === "meta" && Number.isFinite(obj.total)) {
            const total = Number(obj.total);
            await patchProgress(progressId, {
              ...prev,
              total,
              stage: "preparing",
              updatedAt: Date.now(),
            });
          } else if (obj && obj.type === "progress") {
            const processed = Number(obj.processed) || 0;
            const total = Number(obj.total) || prev.total || 0;
            const percent = Math.min(100, total ? Math.floor((processed * 100) / total) : 0);
            const stage = obj.stage || "processing";
            await setProgress(progressId, {
              processed,
              total,
              percent,
              stage,
              updatedAt: Date.now(),
              done: false,
            });
          }
        })().catch(() => {});
      };

      const result = await runPythonScript(pythonPath, scriptPath, args, env, serverRoot, PY_GENERATE_TIMEOUT_MS, onJsonLine);

      // Cleanup temp files
      if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
      if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
      if (fs.existsSync(mappingPath)) fs.unlinkSync(mappingPath);

      if (result.success) {
        // finalize store to 100%
        const prev = (await getProgress(progressId)) || {};
        await patchProgress(progressId, {
          ...prev,
          percent: 100,
          processed: prev.total || result.page_count || prev.processed || 0,
          stage: "done",
          done: true,
          updatedAt: Date.now(),
        });

        return res.json({
          success: true,
          message: "PDF generated successfully",
          downloadUrl: `/uploads/pdf-merge/${outputFileName}`,
          fileName: outputFileName,
          progressId,
          stats: {
            pageCount: result.page_count,
            variablesFound: result.variables_found,
            variablesMapped: result.variables_mapped,
          },
        });
      } else {
        return res.status(500).json({ success: false, message: result.error || "PDF generation failed", progressId });
      }
    } catch (error) {
      try {
        if (templatePath && fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
        if (dataPath && fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
        if (mappingPath && fs.existsSync(mappingPath)) fs.unlinkSync(mappingPath);
      } catch {}

      // mark store as error
      const pid = (req.body && req.body.progressId) || null;
      if (pid) {
        try {
          const prev = (await getProgress(pid)) || {};
          await patchProgress(pid, { ...prev, stage: "error", done: true, updatedAt: Date.now() });
        } catch {}
      }

      return res.status(500).json({
        success: false,
        message: "Server error during PDF generation",
        error: error.message,
      });
    }
  }
);

// Poll current progress
router.get("/progress/:id", async (req, res) => {
  const id = req.params.id;

  // prevent any caching
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });

  const p = await getProgress(id);
  if (!p) {
    return res.json({
      success: true,
      processed: 0,
      total: 0,
      percent: 0,
      stage: "pending",
      done: false,
    });
  }
  return res.json({ success: true, ...p });
});

export { router as pdfMergeRoute };
