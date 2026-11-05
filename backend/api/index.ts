import { buildApp } from "../src/app";

const app = await buildApp();
await app.ready();

export default async function handler(req: any, res: any) {
  app.server.emit("request", req, res);
}