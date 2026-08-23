import fastifyWebsocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { WebSocket } from "ws";

// In-memory active order subscription map: orderId -> Set of WebSockets
const orderSubscribers = new Map<string, Set<WebSocket>>();

export function subscribeToOrder(orderId: string, socket: WebSocket) {
  if (!orderSubscribers.has(orderId)) {
    orderSubscribers.set(orderId, new Set());
  }
  orderSubscribers.get(orderId)?.add(socket);

  socket.on("close", () => {
    orderSubscribers.get(orderId)?.delete(socket);
    if (orderSubscribers.get(orderId)?.size === 0) {
      orderSubscribers.delete(orderId);
    }
  });
}

export function broadcastOrderUpdate(orderId: string, payload: unknown) {
  const subscribers = orderSubscribers.get(orderId);
  if (!subscribers || subscribers.size === 0) return;

  const data = JSON.stringify({
    event: "ORDER_STATUS_UPDATED",
    orderId,
    data: payload,
    timestamp: new Date().toISOString(),
  });

  for (const client of subscribers) {
    if (client.readyState === 1 /* WebSocket.OPEN */) {
      client.send(data);
    }
  }
}

async function websocketPlugin(app: FastifyInstance) {
  await app.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576, // 1MB
    },
  });
}

export default fp(websocketPlugin, {
  name: "websocket",
  dependencies: [],
});
