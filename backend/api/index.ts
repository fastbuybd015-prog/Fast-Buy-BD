let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    // @ts-ignore (dist/app.mjs build er shomoy toiri hoy)
    const { buildApp } = await import("../dist/app.mjs");
    app = await buildApp();
    await app.ready();
  }
  app.server.emit("request", req, res);
}