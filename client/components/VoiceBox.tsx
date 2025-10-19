import { CircularWaveform } from "@pipecat-ai/voice-ui-kit";
import { useState, useRef, useCallback } from "react";
function VoiceBox() {
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const connectAudio = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = stream.getAudioTracks()[0];
      setAudioTrack(track);

      // Create recorder
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        fetch("/transcribe", {
          method: "POST",
          body: blob,
        });
      };

      recorder.start();
      setIsConnected(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, []);

  const disconnectAudio = useCallback((): void => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }

    setAudioTrack(null);
    setIsConnected(false);
  }, []);

  const toggleAudio = useCallback(
    async (e: React.MouseEvent): Promise<void> => {
      e.preventDefault();
      if (isConnected) {
        disconnectAudio();
      } else {
        await connectAudio();
      }
    },
    [disconnectAudio, connectAudio]
  );

  return (
    <div className="flex flex-col items-center">
      <a
        href="#"
        onClick={toggleAudio}
        className={`block rounded-lg p-4 focus:outline-none transition-all`}
        tabIndex={0}
        aria-label={
          isConnected ? "Disconnect microphone" : "Connect microphone"
        }
      >
        <CircularWaveform
          audioTrack={audioTrack}
          isThinking={false}
          color1="#00D3F2"
          color2="#E12AFB"
          size={200}
        />
      </a>
    </div>
  );
}

export default VoiceBox;
