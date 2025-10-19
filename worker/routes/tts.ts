import { IRequest } from "itty-router";
import { Environment } from "../environment";

export async function streamTTS(request: IRequest, env: Environment) {
  // eventually... use some kind of per-user id, so that each user has their own worker
  const id = env.AGENT_DURABLE_OBJECT.idFromName("anonymous");
  const DO = env.AGENT_DURABLE_OBJECT.get(id);
  const response = await DO.fetch(request.url, {
    method: "POST",
    body: request.body as any,
  });

  return new Response(response.body as BodyInit, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Transfer-Encoding": "chunked",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function streamTTSWebSocket(request: IRequest, env: Environment) {
  const id = env.AGENT_DURABLE_OBJECT.idFromName("anonymous");
  const DO = env.AGENT_DURABLE_OBJECT.get(id);
  return DO.fetch(request);
}
