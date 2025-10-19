import {
  useCallback,
  useRef,
  useState,
  createContext,
  useContext,
  PropsWithChildren,
} from "react";

export const AudioProviderContext = createContext<
  ReturnType<typeof useAudio> | undefined
>(undefined);

export const useAudio = () => {
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const connectAudio = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
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
    [disconnectAudio, connectAudio, isConnected]
  );

  return {
    audioTrack,
    isConnected,
    audioURL,
    toggleAudio,
    connectAudio,
    disconnectAudio,
  };
};

export function AudioProvider({ children }: PropsWithChildren) {
  const value = useAudio();
  return (
    <AudioProviderContext.Provider value={value}>
      {children}
    </AudioProviderContext.Provider>
  );
}

export function useAudioContext() {
  const context = useContext(AudioProviderContext);
  if (!context) {
    throw new Error("useAudioContext must be used within an AudioProvider");
  }
  return context;
}
