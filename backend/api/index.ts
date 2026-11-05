let app: any;

async function init() {
  if (app) return app;
  try {
    const { buildApp } = await import("../src/app");
    app = await buildApp();
    await app.ready();
    return app;
  } catch (e: any) {
    console.error("STARTUP ERROR:", e?.message ?? e);
    console.error("DETAILS:", e?.specifier, e?.referrer, e?.importKind);
    console.error(e?.stack);
    throw e;
  }
}

export default async function handler(req: any, res: any) {
  const a = await init();
  a.server.emit("request", req, res);
}