import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import Redis from "ioredis";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { PdfTemplate } from "../models/index.js";
import { spawn, spawnSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

// ----------- LINUX PYTHON HELPERS --------------------
const PYTHON_CMD = process.env.PYTHON_BIN || "python3";

function checkPythonExists(cmd = PYTHON_CMD) {
  try {
    const out = spawnSync("which", [cmd], { encoding: "utf8" });
    return out.status === 0 && out.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

function buildScriptPath(filename) {
  return path.join(ROOT_DIR, "scripts", filename);
}

function makePyEnv(baseEnv = process.env) {
  return { ...baseEnv }; // no venv, no Windows injection
}

// ---- Timeouts & defaults ----
const ANALYZE_TASK_TIMEOUT_SECS = Number(process.env.ANALYZE_TASK_TIMEOUT_SECS || 3600);
const PY_ANALYZE_TIMEOUT_MS = Number(process.env.PY_ANALYZE_TIMEOUT_MS || 3600000);
const PY_GENERATE_TIMEOUT_MS = Number(process.env.PY_GENERATE_TIMEOUT_MS || 3600000);

const DEFAULT_CHUNK_SIZE = Number(process.env.MERGE_CHUNK_SIZE || 8);
const CPU_COUNT = os.cpus()?.length || 2;
const DEFAULT_GEN_WORKERS = Number(process.env.MERGE_GEN_WORKERS || Math.max(1, Math.floor(CPU_COUNT / 4)));
const DEFAULT_CONV_WORKERS = Number(process.env.MERGE_CONV_WORKERS || Math.max(1, Math.floor(CPU_COUNT / 4)));

const PROGRESS_TTL = Number(process.env.PROGRESS_TTL || 60 * 60); // 1 hour

// ---- Progress store: Redis (no-auth by default) with memory fallback ----
const memStore = new Map();

let redis = null;
try {
  if (process.env.REDIS_URL) {
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

// ---- Progress store helpers ----
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

// ---- Run Python helper (NDJSON-capable) ----
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
              // fire & forget—don't block the stream
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

// ---- Cleanup helper ----
function cleanupFiles(...paths) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch (err) {
        console.error(`Failed to cleanup file ${p}:`, err.message);
      }
    }
  }
}

// ===========================
// TEMPLATE MANAGEMENT CONTROLLERS
// ===========================

/**
 * Create a new template
 */
export const createTemplateController = async (req, res) => {
  let uploadedPath = null;

  try {
    await connectMongo();
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "DOCX template file is required",
      });
    }

    const { name, description } = req.body;

    if (!name || !name.trim()) {
      // Cleanup uploaded file
      cleanupFiles(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Template name is required",
      });
    }

    uploadedPath = req.file.path;
    const fileName = req.file.filename;

    // Check if template name already exists
    const existing = await PdfTemplate.findOne({ name: name.trim() }).lean();

    if (existing) {
      cleanupFiles(uploadedPath);
      return res.status(400).json({
        success: false,
        message: "Template name already exists",
      });
    }

    // Create template in database
    const template = await PdfTemplate.create({
      name: name.trim(),
      fileName,
      filePath: uploadedPath,
      description: description?.trim() || null,
    });

    return res.json({
      success: true,
      message: "Template created successfully",
      template: {
        id: String(template._id),
        name: template.name,
        fileName: template.fileName,
        description: template.description,
        createdAt: template.createdAt,
      },
    });
  } catch (error) {
    // Cleanup on error
    if (uploadedPath) {
      cleanupFiles(uploadedPath);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create template",
      error: error.message,
    });
  }
};

/**
 * Get all templates
 */
export const getTemplatesController = async (req, res) => {
  try {
    await connectMongo();
    const templates = await PdfTemplate.find({})
      .sort({ createdAt: -1 })
      .select("name fileName description createdAt updatedAt")
      .lean();

    return res.json({
      success: true,
      templates: templates.map((template) => ({
        id: String(template._id),
        ...template,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
      error: error.message,
    });
  }
};

/**
 * Get single template by ID
 */
export const getTemplateByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    await connectMongo();
    const templateId = toObjectId(id);
    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID",
      });
    }

    const template = await PdfTemplate.findById(templateId).lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.json({
      success: true,
      template: {
        id: String(template._id),
        name: template.name,
        fileName: template.fileName,
        description: template.description,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch template",
      error: error.message,
    });
  }
};

/**
 * Delete template
 */
export const deleteTemplateController = async (req, res) => {
  try {
    const { id } = req.params;

    await connectMongo();
    const templateId = toObjectId(id);
    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID",
      });
    }

    const template = await PdfTemplate.findById(templateId).lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Delete file from filesystem
    cleanupFiles(template.filePath);

    // Delete from database
    await PdfTemplate.deleteOne({ _id: templateId });

    return res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete template",
      error: error.message,
    });
  }
};

// ===========================
// PDF GENERATION CONTROLLERS (UPDATED)
// ===========================

/**
 * Test endpoint
 */
export const testController = (req, res) => {
  res.json({
    success: true,
    message: "PDF Merge route is working!",
    timestamp: new Date().toISOString(),
  });
};

/**
 * Analyze files endpoint (UPDATED to use template ID)
 */
export const analyzeFilesController = async (req, res) => {
  let dataPath = null;

  try {
    // Check for CSV/XLSX file
    if (!req.files || !req.files.csv) {
      return res.status(400).json({
        success: false,
        message: "CSV/XLSX file is required",
      });
    }

    // Get template ID from request body
    const { templateId } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    // Fetch template from database
    await connectMongo();
    const templateObjectId = toObjectId(templateId);
    if (!templateObjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID",
      });
    }
    const template = await PdfTemplate.findById(templateObjectId).lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Verify template file exists
    if (!fs.existsSync(template.filePath)) {
      return res.status(500).json({
        success: false,
        message: "Template file not found on server",
      });
    }

    const templatePath = template.filePath;
    dataPath = req.files.csv[0].path;

    const serverRoot = ROOT_DIR;

    const pythonPath = PYTHON_CMD;
    const scriptPath = buildScriptPath("analyze_files.py");

    if (!checkPythonExists(pythonPath)) {
      return res.status(500).json({
        success: false,
        message: `Python not found: "${pythonPath}". Set PYTHON_BIN or install python3 in PATH.`,
      });
    }
    if (!fs.existsSync(scriptPath)) {
      return res.status(500).json({ success: false, message: "Analysis script not found" });
    }

    const env = makePyEnv(process.env);

    // Optional analyzer flags
    const sheetName = typeof req.body.sheetName === "string" ? req.body.sheetName : null;
    const sheetIndex = Number.isFinite(Number(req.body.sheetIndex)) ? String(Number(req.body.sheetIndex)) : null;
    const encoding = typeof req.body.encoding === "string" ? req.body.encoding : null;

    const args = ["--template", templatePath, "--data", dataPath, "--timeout", String(ANALYZE_TASK_TIMEOUT_SECS)];
    if (sheetName) args.push("--sheet-name", sheetName);
    if (sheetIndex !== null) args.push("--sheet-index", sheetIndex);
    if (encoding) args.push("--encoding", encoding);

    const result = await runPythonScript(pythonPath, scriptPath, args, env, serverRoot, PY_ANALYZE_TIMEOUT_MS);

    // Clean up only the data file (keep template)
    cleanupFiles(dataPath);

    return res.json({
      success: true,
      templateVariables: result.template_variables || [],
      csvHeaders: result.csv_headers || [],
      templateSource: result.template_source || "unknown",
      notes: result.notes || "",
      templateName: template.name,
    });
  } catch (error) {
    // Cleanup on error
    cleanupFiles(dataPath);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze files",
      error: error.message,
    });
  }
};

/**
 * Generate PDF endpoint (UPDATED to use template ID)
 */
export const generatePdfController = async (req, res) => {
  let dataPath = null;
  let mappingPath = null;

  try {
    // Check for CSV/XLSX file
    if (!req.files || !req.files.csv) {
      return res.status(400).json({
        success: false,
        message: "CSV/XLSX file is required",
      });
    }

    // Get template ID from request body
    const { templateId } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    // Fetch template from database
    await connectMongo();
    const templateObjectId = toObjectId(templateId);
    if (!templateObjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID",
      });
    }
    const template = await PdfTemplate.findById(templateObjectId).lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Verify template file exists
    if (!fs.existsSync(template.filePath)) {
      return res.status(500).json({
        success: false,
        message: "Template file not found on server",
      });
    }

    const templatePath = template.filePath;
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

    const pythonPath = PYTHON_CMD;
    const scriptPath = buildScriptPath("generate_merged_pdf.py");

    if (!checkPythonExists(pythonPath)) {
      return res.status(500).json({
        success: false,
        message: `Python not found: "${pythonPath}". Set PYTHON_BIN or install python3 in PATH.`,
      });
    }
    if (!fs.existsSync(scriptPath)) {
      return res.status(500).json({ success: false, message: "Generation script not found" });
    }

    const env = makePyEnv(process.env);

    // Save mapping JSON
    mappingPath = path.join(ROOT_DIR, "uploads", "pdf-merge", `mapping-${Date.now()}.json`);
    fs.writeFileSync(mappingPath, JSON.stringify(mapping));

    // Tuning knobs
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

    // Cleanup temp files (keep template)
    cleanupFiles(dataPath, mappingPath);

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
      return res.status(500).json({
        success: false,
        message: result.error || "PDF generation failed",
        progressId,
      });
    }
  } catch (error) {
    cleanupFiles(dataPath, mappingPath);

    // mark store as error
    const pid = (req.body && req.body.progressId) || null;
    if (pid) {
      try {
        const prev = (await getProgress(pid)) || {};
        await patchProgress(pid, {
          ...prev,
          stage: "error",
          done: true,
          updatedAt: Date.now(),
        });
      } catch {}
    }

    return res.status(500).json({
      success: false,
      message: "Server error during PDF generation",
      error: error.message,
    });
  }
};

/**
 * Get progress endpoint
 */
export const getProgressController = async (req, res) => {
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
};
