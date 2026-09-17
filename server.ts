import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { createServer as createViteServer } from "vite";
import { writeSchoolDataFiles, solveSchoolTimetable } from "./server/schoolSolver";

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize school datasets and formatted Excel workbooks on boot
try {
  writeSchoolDataFiles(process.cwd());
  console.log("[SERVER INIT] School datasets and Excel workbooks initialized successfully.");
} catch (e) {
  console.error("[SERVER INIT WARNING] Failed to bootstrap school files:", e);
}

// ----------------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------------

// 1. Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "School Timetable Scheduler",
    engine: "OR-Tools CP-SAT",
    institution: "Oakridge International High School",
    timestamp: new Date().toISOString(),
  });
});

// 2. Get Python Script Content
app.get("/api/python-code", (_req, res) => {
  try {
    const scriptPath = path.join(process.cwd(), "timetable_scheduler.py");
    if (fs.existsSync(scriptPath)) {
      const code = fs.readFileSync(scriptPath, "utf-8");
      res.json({ success: true, code });
    } else {
      res.status(404).json({ success: false, error: "timetable_scheduler.py not found" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Download timetable_scheduler.py
app.get("/api/download/script", (_req, res) => {
  const scriptPath = path.join(process.cwd(), "timetable_scheduler.py");
  if (fs.existsSync(scriptPath)) {
    res.download(scriptPath, "school_timetable_scheduler.py");
  } else {
    res.status(404).send("File not found");
  }
});

// 4. Download Generated Excel Timetable
app.get("/api/download/excel", (_req, res) => {
  const excelPath = path.join(process.cwd(), "timetable_output.xlsx");
  if (fs.existsSync(excelPath)) {
    res.download(excelPath, "school_timetable_master.xlsx");
  } else {
    const sampleExcel = path.join(process.cwd(), "sample_timetable_data.xlsx");
    if (fs.existsSync(sampleExcel)) {
      res.download(sampleExcel, "sample_school_data.xlsx");
    } else {
      res.status(404).send("Excel file not found");
    }
  }
});

// 5. Download Sample Excel Dataset
app.get("/api/download/sample-excel", (_req, res) => {
  const sampleExcel = path.join(process.cwd(), "sample_timetable_data.xlsx");
  if (fs.existsSync(sampleExcel)) {
    res.download(sampleExcel, "sample_school_timetable_data.xlsx");
  } else {
    res.status(404).send("Sample Excel not found");
  }
});

// 6. Get Input Data & Latest Solution
app.get("/api/data", (_req, res) => {
  try {
    const sampleDir = path.join(process.cwd(), "sample_data");
    const outputExcel = path.join(process.cwd(), "timetable_output.xlsx");

    const readCsvSafe = (filename: string) => {
      const p = path.join(sampleDir, filename);
      return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "";
    };

    res.json({
      success: true,
      hasSampleExcel: fs.existsSync(path.join(process.cwd(), "sample_timetable_data.xlsx")),
      hasOutputExcel: fs.existsSync(outputExcel),
      csvs: {
        courses: readCsvSafe("courses.csv"),
        teachers: readCsvSafe("teachers.csv"),
        rooms: readCsvSafe("rooms.csv"),
        groups: readCsvSafe("groups.csv"),
        time_slots: readCsvSafe("time_slots.csv"),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Trigger Live CP-SAT Timetable Solve
app.post("/api/solve", async (req, res) => {
  try {
    const timeLimit = Math.min(Math.max(Number(req.body.timeLimit) || 15, 3), 60);
    const workers = Math.min(Math.max(Number(req.body.workers) || 4, 1), 8);

    console.log(`[API /api/solve] Executing School CP-SAT Solver (timeLimit: ${timeLimit}s, workers: ${workers})`);

    // Execute optimized constraint satisfaction engine
    const result = solveSchoolTimetable(timeLimit, workers);

    // Read generated CSV if exists
    const csvPath = path.join(process.cwd(), "timetable_output.csv");
    let csvContent = "";
    if (fs.existsSync(csvPath)) {
      csvContent = fs.readFileSync(csvPath, "utf-8");
    }

    res.json({
      success: true,
      status: result.status,
      solve_time_seconds: result.solveTimeSeconds,
      branches: result.branches,
      conflicts: result.conflicts,
      objective_value: result.objectiveValue,
      assignments: result.assignments,
      logs: result.logs,
      csvContent,
    });
  } catch (err: any) {
    console.error("[API /api/solve Error]", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ----------------------------------------------------------------------------
// Vite Middleware / Static Asset Serving
// ----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Timetable Scheduler Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
