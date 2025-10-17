import express from "express";
import multer from "multer";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "pdf-merge");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
});

// Helper function to run Python script
function runPythonScript(pythonPath, scriptPath, args, env, serverRoot) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonPath, [scriptPath, ...args], {
      env: env,
      cwd: serverRoot,
    });

    let outputData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("Python stdout:", output);
      outputData += output;
    });

    pythonProcess.stderr.on("data", (data) => {
      const error = data.toString();
      console.error("Python stderr:", error);
      errorData += error;
    });

    pythonProcess.on("close", (code) => {
      console.log("Python process exited with code:", code);
      if (code === 0) {
        try {
          const result = JSON.parse(outputData);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      } else {
        reject(new Error(errorData || `Python script exited with code ${code}`));
      }
    });

    pythonProcess.on("error", (error) => {
      reject(error);
    });
  });
}

// POST endpoint to analyze files and extract variables/headers
router.post(
  "/analyze",
  upload.fields([
    { name: "template", maxCount: 1 },
    { name: "csv", maxCount: 1 },
  ]),
  async (req, res) => {
    let templatePath = null;
    let csvPath = null;

    try {
      if (!req.files || !req.files.template || !req.files.csv) {
        return res.status(400).json({
          success: false,
          message: "Both template PDF and CSV file are required",
        });
      }

      templatePath = req.files.template[0].path;
      csvPath = req.files.csv[0].path;

      const serverRoot = process.cwd();
      const pythonPath = path.join(serverRoot, "venv", "Scripts", "python.exe");
      const scriptPath = path.join(serverRoot, "scripts", "analyze_files.py");

      if (!fs.existsSync(pythonPath)) {
        return res.status(500).json({
          success: false,
          message: "Python environment not properly configured",
        });
      }

      const env = { ...process.env };
      const venvPath = path.join(serverRoot, "venv");
      const venvScriptsPath = path.join(venvPath, "Scripts");
      const venvLibPath = path.join(venvPath, "Lib", "site-packages");
      
      env.PATH = `${venvScriptsPath};${env.PATH}`;
      env.VIRTUAL_ENV = venvPath;
      env.PYTHONPATH = venvLibPath;

      console.log("Analyzing files...");

      const result = await runPythonScript(
        pythonPath,
        scriptPath,
        ["--template", templatePath, "--csv", csvPath],
        env,
        serverRoot
      );

      // Clean up uploaded files
      fs.unlinkSync(templatePath);
      fs.unlinkSync(csvPath);

      res.json({
        success: true,
        templateVariables: result.template_variables || [],
        csvHeaders: result.csv_headers || [],
      });
    } catch (error) {
      console.error("Error analyzing files:", error);
      
      // Clean up files on error
      if (templatePath && fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
      if (csvPath && fs.existsSync(csvPath)) fs.unlinkSync(csvPath);

      res.status(500).json({
        success: false,
        message: "Failed to analyze files",
        error: error.message,
      });
    }
  }
);

// POST endpoint to generate merged PDF
router.post(
  "/generate",
  upload.fields([
    { name: "template", maxCount: 1 },
    { name: "csv", maxCount: 1 },
  ]),
  async (req, res) => {
    let templatePath = null;
    let csvPath = null;

    try {
      if (!req.files || !req.files.template || !req.files.csv) {
        return res.status(400).json({
          success: false,
          message: "Both template PDF and CSV file are required",
        });
      }

      templatePath = req.files.template[0].path;
      csvPath = req.files.csv[0].path;
      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};
      
      const outputFileName = `merged-${Date.now()}.pdf`;
      const outputPath = path.join(
        process.cwd(),
        "uploads",
        "pdf-merge",
        outputFileName
      );

      const serverRoot = process.cwd();
      const pythonPath = path.join(serverRoot, "venv", "Scripts", "python.exe");
      const scriptPath = path.join(serverRoot, "scripts", "generate_merged_pdf.py");

      if (!fs.existsSync(pythonPath)) {
        return res.status(500).json({
          success: false,
          message: "Python environment not properly configured",
        });
      }

      console.log("=== PDF Merge Debug Info ===");
      console.log("Template:", templatePath);
      console.log("CSV:", csvPath);
      console.log("Output:", outputPath);
      console.log("Mapping:", mapping);
      console.log("==========================");

      const env = { ...process.env };
      const venvPath = path.join(serverRoot, "venv");
      const venvScriptsPath = path.join(venvPath, "Scripts");
      const venvLibPath = path.join(venvPath, "Lib", "site-packages");
      
      env.PATH = `${venvScriptsPath};${env.PATH}`;
      env.VIRTUAL_ENV = venvPath;
      env.PYTHONPATH = venvLibPath;

      // Save mapping to a temp file
      const mappingPath = path.join(serverRoot, "uploads", "pdf-merge", `mapping-${Date.now()}.json`);
      fs.writeFileSync(mappingPath, JSON.stringify(mapping));

      const result = await runPythonScript(
        pythonPath,
        scriptPath,
        [
          "--template", templatePath,
          "--csv", csvPath,
          "--output", outputPath,
          "--mapping", mappingPath
        ],
        env,
        serverRoot
      );

      // Clean up
      fs.unlinkSync(templatePath);
      fs.unlinkSync(csvPath);
      fs.unlinkSync(mappingPath);

      if (result.success) {
        res.json({
          success: true,
          message: "PDF generated successfully",
          downloadUrl: `/uploads/pdf-merge/${outputFileName}`,
          fileName: outputFileName,
          stats: {
            pageCount: result.page_count,
            variablesFound: result.variables_found,
            variablesMapped: result.variables_mapped,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error || "PDF generation failed",
        });
      }
    } catch (error) {
      console.error("Error in PDF merge:", error);
      
      // Clean up files on error
      if (templatePath && fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
      if (csvPath && fs.existsSync(csvPath)) fs.unlinkSync(csvPath);

      res.status(500).json({
        success: false,
        message: "Server error during PDF generation",
        error: error.message,
      });
    }
  }
);

export { router as pdfMergeRoute };