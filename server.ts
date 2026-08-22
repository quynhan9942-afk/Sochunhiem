import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));

// In-memory data store with file backing
const memoryStore: Record<string, any> = {};

const getStoreFilePath = (classId: string) => {
  const safeId = classId.replace(/[^a-zA-Z0-9_]/g, "_");
  return path.join(process.cwd(), `store_${safeId}.json`);
};

const loadInitialDataFromFile = (classId: string) => {
  try {
    const filePath = getStoreFilePath(classId);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`Failed to read stored data for ${classId}:`, err);
  }
  return null;
};

const saveDataToFile = (classId: string, data: any) => {
  try {
    const filePath = getStoreFilePath(classId);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn(`Failed to write store file for ${classId}:`, err);
  }
};

// Cloud Sync Endpoints
app.get("/api/sync/:classId?", (req, res) => {
  const classId = req.params.classId || "6a3_nguyenvancu";
  let data = memoryStore[classId];
  if (!data) {
    data = loadInitialDataFromFile(classId);
    if (data) {
      memoryStore[classId] = data;
    }
  }
  res.json(data || { status: "empty", message: "No data stored yet" });
});

app.post("/api/sync/:classId?", (req, res) => {
  const classId = req.params.classId || "6a3_nguyenvancu";
  const body = req.body;
  if (!body) {
    return res.status(400).json({ error: "Invalid data payload" });
  }

  const payload = {
    ...body,
    serverUpdatedAt: new Date().toISOString(),
    timestamp: Date.now(),
  };

  memoryStore[classId] = payload;
  memoryStore["6a3_nguyenvancu"] = payload;
  memoryStore["lop_6a3"] = payload;

  saveDataToFile("6a3_nguyenvancu", payload);
  saveDataToFile("lop_6a3", payload);

  res.json({
    success: true,
    message: "Data synced to cloud successfully",
    timestamp: payload.timestamp,
  });
});

// Primary start function
async function startServer() {
  // Vite dev middleware vs production static server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cloud Sync Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
