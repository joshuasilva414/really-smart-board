import { CircularWaveform } from "@pipecat-ai/voice-ui-kit";
import { useAudioContext } from "../hooks/useAudio";
function VoiceBox() {
  const { audioTrack, isConnected, toggleAudio } = useAudioContext();

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
