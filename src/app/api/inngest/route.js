import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { analyzeFurnitureImage } from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    analyzeFurnitureImage,
  ],
});

// Allow long-running AI analysis on Vercel (up to 5 minutes)
export const maxDuration = 300;
