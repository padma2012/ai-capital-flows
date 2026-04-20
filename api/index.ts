import express from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

const app = express();
app.use(express.json());

const server = createServer(app);
registerRoutes(server, app);

export default app;
