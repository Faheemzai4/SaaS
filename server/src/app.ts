import "./types/express";

import express from "express";
import cors from "cors";

import leadRoutes from "./routes/local/lead.routes";
import discoverRoutes from "./routes/local/discover.routes";
import onlineDiscoverRouter from "./routes/online/discover.routes";
import onlineLeadRoutes from "./routes/online/lead.routes";
import onlineStatsRoutes from "./routes/online/stats.routes";
import { requireAuth } from "./middleware/requireAuth";   
import usageRoutes from "./routes/usage.routes";
import profileRoutes from "./routes/profile.routes";

const app = express();

app.use(cors());
app.use(express.json());

// online
app.use("/online/discover", requireAuth, onlineDiscoverRouter);
app.use("/online/leads", requireAuth, onlineLeadRoutes);
app.use("/online/stats", requireAuth, onlineStatsRoutes);

// local
app.use("/leads", requireAuth, leadRoutes);

app.use("/discover", requireAuth, discoverRoutes);

// profile
app.use("/profile", requireAuth, profileRoutes);

// usage
app.use("/usage", requireAuth, usageRoutes);


app.get("/", (_, res) => {
  res.json({
    message: "AI Sales Agent API Running",
  });
});

export default app;
