import { AgentAction } from "shared/types/AgentAction";
import { Environment } from "../environment";
import { WebSocket } from "ws";
import { Streaming } from "shared/types/Streaming";

const VOICE_ID = "5kMbtRSEKIkRZSdXxrZg";
const MODEL_ID = "eleven_flash_v2_5";

export class ElevenLabsService {
  constructor(private readonly env: Environment) {}

  async *streamTTS(text: string): AsyncGenerator<Streaming<AgentAction>> {
    const WEBSOCKET_URI = `wss://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/multi-stream-input?model_id=${MODEL_ID}`;
    const ws = new WebSocket(WEBSOCKET_URI, {
      headers: {
        "xi-api-key": this.env.ELEVENLABS_API_KEY,
      },
    });
  }

  private async transcribe(request: Request): Promise<string> {
    return new Promise((res, req) => res(""));
  }
}
