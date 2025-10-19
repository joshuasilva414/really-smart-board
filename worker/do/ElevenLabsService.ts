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
 async transcribe(request: Request): Promise<string> {
    try {
      const blob = await request.blob();
      const form = new FormData()
     
      form.append('file', blob, 'voice.webm')
      form.append('model_id', 'scribe_v1')

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': this.env.ELEVENLABS_API_KEY,
        },
        body: form,
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('Eleven Labs transcription error:', response.status, errText)
        return ''
      }

  const data = (await response.json()) as { text?: string } | undefined
  return (data && (data.text ?? '')) || ''
    } catch (error) {
      console.error('Eleven Labs transcription error:', error)
      return ''
    }
  }
}
