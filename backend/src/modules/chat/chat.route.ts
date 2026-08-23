import { GoogleGenAI } from "@google/genai";
import { and, eq, ilike, or } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { env } from "@/config/env";
import { getDb } from "@/db";
import { orderItems, orders, products, storeProducts } from "@/db/schema";
import { optionalAuth } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "model"]),
        content: z.string(),
      }),
    )
    .optional(),
  orderId: z.string().optional(),
});

const chatResponseSchema = z.object({
  reply: z.string(),
  suggestedActions: z
    .array(
      z.object({
        label: z.string(),
        action: z.enum(["NAVIGATE", "TRACK_ORDER", "VIEW_DEALS", "VIEW_PRODUCT", "VIEW_BUDGET"]),
        payload: z.string().optional(),
      }),
    )
    .optional(),
  productCards: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        store: z.string(),
        unit: z.string(),
        image: z.string().nullable(),
      }),
    )
    .optional(),
  orderStatus: z
    .object({
      orderNumber: z.string(),
      status: z.string(),
      total: z.string(),
      itemCount: z.number(),
    })
    .optional(),
});

/** Query DB for live products matching user search */
async function findProductsFromDb(query: string) {
  try {
    const db = getDb();
    const stopWords = new Set([
      "what",
      "where",
      "when",
      "which",
      "your",
      "have",
      "with",
      "from",
      "this",
      "that",
      "delivery",
      "order",
      "price",
      "koto",
      "daam",
      "koi",
      "ache",
    ]);
    const searchTerms = query
      .replace(/[^\w\s\u0980-\u09FF]/gi, "")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));

    if (searchTerms.length === 0) return [];

    const conditions = searchTerms.map((term) => ilike(products.name, `%${term}%`));

    const matched = await db.query.products.findMany({
      where: and(eq(products.isActive, true), or(...conditions)),
      limit: 4,
      with: {
        storeProducts: {
          where: eq(storeProducts.isActive, true),
          limit: 1,
          with: {
            store: { columns: { name: true } },
          },
        },
      },
    });

    return matched.map((p) => {
      const primaryListing = p.storeProducts[0];
      return {
        id: p.id,
        name: p.name,
        price: primaryListing ? Number(primaryListing.price) : 0,
        store: primaryListing?.store?.name || "FastShop Superstore",
        unit: p.unit,
        image: null,
      };
    });
  } catch {
    return [];
  }
}

/** Query DB for live order details if user provides order number */
async function findOrderFromDb(query: string) {
  try {
    const db = getDb();
    const isUuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(query);
    const fsbMatch = query.match(/FSB-[\w\d-]+/i);

    let order = null;

    if (fsbMatch) {
      order = await db.query.orders.findFirst({
        where: eq(orders.orderNumber, fsbMatch[0].toUpperCase()),
      });
    } else if (isUuid) {
      const uuidMatch = query.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
      );
      if (uuidMatch) {
        order = await db.query.orders.findFirst({
          where: eq(orders.id, uuidMatch[0]),
        });
      }
    }

    if (!order) return null;

    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, order.id),
      limit: 10,
    });

    return {
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      total: order.grandTotal,
      itemCount: items.length,
      placedAt: order.placedAt,
    };
  } catch {
    return null;
  }
}

export const chatRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", optionalAuth);

  app.post(
    "/assistant",
    {
      schema: {
        tags: ["AI Assistant"],
        summary: "FastShop AI Customer Support & Shopping Assistant",
        body: chatRequestSchema,
        response: { 200: successSchema(chatResponseSchema) },
      },
    },
    async (request) => {
      const { message } = request.body;

      // 1. Check if user is asking about order tracking
      const matchedOrder = await findOrderFromDb(message);

      // 2. Check if user is asking about product search / pricing
      const matchedProducts = await findProductsFromDb(message);

      // 3. If Gemini API Key is configured, use Gemini GenAI SDK
      if (env.geminiApiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

          const systemPrompt = `You are FastShop Assistant, Dhaka's smartest and friendliest AI grocery shopping assistant for FastShopBD.
You assist customers in both English, Bengali (বাংলা), and Banglish depending on how the user talks to you.
Key platform facts:
- FastShopBD is Dhaka's #1 hyperlocal multi-store marketplace partnering with Shwapno, Chaldal, Meena Bazar, Agora, and Unimart.
- Express delivery in 30-45 minutes directly from the nearest store hub.
- Delivery fee: ৳30 (Free delivery on orders over ৳1,000).
- Payment methods: bKash, Nagad, Rocket (Manual MFS TrxID verification) and Cash on Delivery.
- Fast Buy VIP Membership: ৳199/month with 1 Day Free Trial for unlimited zero-fee deliveries.
- Smart Features: Multi-store live price comparison (/compare), Smart Budget Basket (/smart-budget), and Basket Cost Optimizer (/basket-optimizer).

Database Context Available:
${matchedOrder ? `Live Order Found in Database: Order Number: ${matchedOrder.orderNumber}, Status: ${matchedOrder.status}, Payment: ${matchedOrder.paymentStatus}, Total: ৳${matchedOrder.total}` : "No specific order mentioned."}
${matchedProducts.length > 0 ? `Live Products Found in Database: ${JSON.stringify(matchedProducts)}` : "No direct product catalog match."}

Be polite, helpful, concise, and structured. Highlight prices in Bangladeshi Taka (৳). If an order was found, clearly explain its status and next steps.`;

          const contents = [
            {
              role: "user" as const,
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
            },
          ];

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
          });


          const replyText =
            response.text || "Hello! How can I assist you with your FastShop grocery order today?";

          return ok({
            reply: replyText,
            productCards: matchedProducts.length > 0 ? matchedProducts : undefined,
            orderStatus: matchedOrder
              ? {
                  orderNumber: matchedOrder.orderNumber,
                  status: matchedOrder.status,
                  total: matchedOrder.total,
                  itemCount: matchedOrder.itemCount,
                }
              : undefined,
            suggestedActions: [
              { label: "📦 Track an Order", action: "NAVIGATE", payload: "/orders" },
              { label: "🔥 Today's Mega Deals", action: "VIEW_DEALS", payload: "/deals" },
              { label: "💰 Smart Budget Basket", action: "VIEW_BUDGET", payload: "/smart-budget" },
            ],
          });
        } catch (err) {
          app.log.warn({ err }, "Gemini API call error, falling back to smart DB assistant");
        }
      }

      // 4. Intelligent Local DB Assistant Fallback (when API key is missing or on quota)
      let replyText = "";
      if (matchedOrder) {
        replyText = `আপনার অর্ডার **${matchedOrder.orderNumber}** এর বর্তমান স্ট্যাটাস: **${matchedOrder.status.replace(/_/g, " ")}** (Payment: ${matchedOrder.paymentStatus})। সর্বমোট: ৳${matchedOrder.total}। আমাদের ডেলিভারি টিম দ্রুততম সময়ে আপনার ঠিকানায় পৌঁছাতে কাজ করছে!`;
      } else if (matchedProducts.length > 0) {
        replyText = `আমাদের ডেটাবেজে আপনার পছন্দের প্রোডাক্টগুলো পাওয়া গেছে! নিচে রিয়েল-টাইম লাইভ মূল্য ও স্টোর তালিকা দেওয়া হলো:`;
      } else if (
        message.toLowerCase().includes("delivery") ||
        message.toLowerCase().includes("ডেলিভারি")
      ) {
        replyText = `FastShopBD ঢাকা শহরের নিকটস্থ লোকাল হাব থেকে **৩০ থেকে ৪৫ মিনিটের মধ্যে** এক্সপ্রেস ডেলিভারি নিশ্চিত করে। ডেলিভারি চার্জ মাত্র ৳৩০ (৳১,০০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি)।`;
      } else if (
        message.toLowerCase().includes("bkash") ||
        message.toLowerCase().includes("পেমেন্ট") ||
        message.toLowerCase().includes("payment")
      ) {
        replyText = `আমরা **bKash, Nagad, Rocket** এবং **Cash on Delivery (COD)** সাপোর্ট করি। মোবাইল ব্যাংকিংয়ের ক্ষেত্রে TrxID সাবমিট করলেই আমাদের ফাইন্যান্স টিম ১-২ মিনিটের মধ্যে পেমেন্ট ভেরিফাই করে দেয়।`;
      } else if (
        message.toLowerCase().includes("budget") ||
        message.toLowerCase().includes("বাজেট")
      ) {
        replyText = `আপনার নির্দিষ্ট বাজেটের মধ্যে সেরা মাল্টি-স্টোর বাজার তালিকা তৈরি করতে আমাদের **Smart Budget Basket** টুলটি ব্যবহার করতে পারেন (/smart-budget)।`;
      } else {
        replyText = `স্বাগতম FastShopBD-তে! আমি আপনার স্মার্ট শপিং অ্যাসিস্ট্যান্ট। চাল, তেল, ডিম সহ যে কোনো পণ্যের দাম জানতে পারেন, আপনার অর্ডার ট্র্যাক করতে পারেন অথবা আজকের সেরা ডিসকাউন্ট দেখতে পারেন।`;
      }

      return ok({
        reply: replyText,
        productCards: matchedProducts.length > 0 ? matchedProducts : undefined,
        orderStatus: matchedOrder
          ? {
              orderNumber: matchedOrder.orderNumber,
              status: matchedOrder.status,
              total: matchedOrder.total,
              itemCount: matchedOrder.itemCount,
            }
          : undefined,
        suggestedActions: [
          { label: "📦 Track an Order", action: "NAVIGATE", payload: "/orders" },
          { label: "🔥 Today's Mega Deals", action: "VIEW_DEALS", payload: "/deals" },
          { label: "💰 Smart Budget Tool", action: "VIEW_BUDGET", payload: "/smart-budget" },
        ],
      });
    },
  );
};
