import { AgentAction } from "shared/types/AgentAction";
import { Environment } from "../environment";
import { Streaming } from "shared/types/Streaming";

const VOICE_ID = "5kMbtRSEKIkRZSdXxrZg";
const MODEL_ID = "eleven_flash_v2_5";

export class ElevenLabsService {
  constructor(private readonly env: Environment) {}

  async *streamTTS(text: string): AsyncGenerator<Streaming<EncodedAudioChunk>> {
    // Deprecated in favor of WebSocket bridge; left as no-op to keep API stable
    if (text) {
      // Intentionally ignored
    }
    return;
  }

  async streamTTSWebSocket(request: Request): Promise<Response> {
    const WEBSOCKET_URI = `wss://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/multi-stream-input?model_id=${MODEL_ID}`;

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

    server.accept();

    const upstreamResp = await fetch(WEBSOCKET_URI, {
      headers: {
        Upgrade: "websocket",
        "xi-api-key": this.env.ELEVENLABS_API_KEY,
      },
    });

    const upstream = upstreamResp.webSocket as WebSocket | null;
    if (!upstream) {
      try {
        server.close(1011, "Upstream upgrade failed");
      } catch {}
      return new Response("Upstream upgrade failed", { status: 502 });
    }

    upstream.accept();

    // Pipe messages from client -> upstream
    server.addEventListener("message", (evt: MessageEvent) => {
      try {
        upstream.send(evt.data as any);
      } catch (e) {
        try {
          server.close(1011, "Upstream send failed");
        } catch {}
      }
    });

    // Pipe messages from upstream -> client
    upstream.addEventListener("message", (evt: MessageEvent) => {
      try {
        server.send(evt.data as any);
      } catch (e) {
        try {
          upstream.close(1011, "Downstream send failed");
        } catch {}
      }
    });

    // Mirror close events
    server.addEventListener("close", (evt: CloseEvent) => {
      try {
        upstream.close(evt.code, evt.reason);
      } catch {}
    });
    upstream.addEventListener("close", (evt: CloseEvent) => {
      try {
        server.close(evt.code, evt.reason);
      } catch {}
    });

    // Mirror error events
    server.addEventListener("error", () => {
      try {
        upstream.close(1011, "server error");
      } catch {}
    });
    upstream.addEventListener("error", () => {
      try {
        server.close(1011, "upstream error");
      } catch {}
    });

    return new Response(null, { status: 101, webSocket: client });
  }
  async transcribe(request: Request): Promise<string> {
    try {
      const blob = await request.blob();
      const form = new FormData();

      form.append("file", blob, "voice.webm");
      form.append("model_id", "scribe_v1");

      const response = await fetch(
        "https://api.elevenlabs.io/v1/speech-to-text",
        {
          method: "POST",
          headers: {
            "xi-api-key": this.env.ELEVENLABS_API_KEY,
          },
          body: form,
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(
          "Eleven Labs transcription error:",
          response.status,
          errText
        );
        return "";
      }

      const data = (await response.json()) as { text?: string } | undefined;
      return (data && (data.text ?? "")) || "";
    } catch (error) {
      console.error("Eleven Labs transcription error:", error);
      return "";
    }
  }
}
