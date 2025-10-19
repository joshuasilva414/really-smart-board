import { CircularWaveform } from "@pipecat-ai/voice-ui-kit";
import { useState, useRef } from "react";
function VoiceBox() {
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);



  const connectAudio = async () => {
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
        fetch(
            "/transcribe",
            {
                method: "POST",
                body: blob,
            }
        );
      };

      recorder.start();
      setIsConnected(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const disconnectAudio = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    setAudioTrack(null);
    setIsConnected(false);
  };

  const toggleAudio = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isConnected) {
      disconnectAudio();
    } else {
      await connectAudio();
    }
  };

  return (
    <div className="space-y-4 flex flex-col items-center">
      <a
        href="#"
        onClick={toggleAudio}
        className={`block w-80 h-80 rounded-lg p-4 focus:outline-none transition-all ${
          isConnected ? "bg-blue-100" : "bg-gray-50"
        }`}
        tabIndex={0}
        aria-label={isConnected ? "Disconnect microphone" : "Connect microphone"}
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
