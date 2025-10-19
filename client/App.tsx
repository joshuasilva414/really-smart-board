import { useEffect, useMemo, useState, useRef } from "react";
import {
  DefaultSizeStyle,
  ErrorBoundary,
  TLComponents,
  Tldraw,
  TldrawUiToastsProvider,
  TLUiOverrides,
  useEditor,
} from "tldraw";
import { TldrawAgent } from "./agent/TldrawAgent";
import { useTldrawAgent } from "./agent/useTldrawAgent";
import { ChatPanel } from "./components/ChatPanel";
import { ChatPanelFallback } from "./components/ChatPanelFallback";
import { CustomHelperButtons } from "./components/CustomHelperButtons";
import { AgentViewportBoundsHighlight } from "./components/highlights/AgentViewportBoundsHighlights";
import { ContextHighlights } from "./components/highlights/ContextHighlights";
import { enableLinedFillStyle } from "./enableLinedFillStyle";
import { TargetAreaTool } from "./tools/TargetAreaTool";
import { TargetShapeTool } from "./tools/TargetShapeTool";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, ArrowUp, X, FileText, Image as ImageIcon } from "lucide-react";

/**
 * The ID used for this project's agent.
 * If you want to support multiple agents, you can use a different ID for each agent.
 */
export const AGENT_ID = "agent-starter";

// Customize tldraw's styles to play to the agent's strengths
DefaultSizeStyle.setDefaultValue("s");
enableLinedFillStyle();

// Custom tools for picking context items
const tools = [TargetShapeTool, TargetAreaTool];
const overrides: TLUiOverrides = {
  tools: (editor, tools) => {
    return {
      ...tools,
      "target-area": {
        id: "target-area",
        label: "Pick Area",
        kbd: "c",
        icon: "tool-frame",
        onSelect() {
          editor.setCurrentTool("target-area");
        },
      },
      "target-shape": {
        id: "target-shape",
        label: "Pick Shape",
        kbd: "s",
        icon: "tool-frame",
        onSelect() {
          editor.setCurrentTool("target-shape");
        },
      },
    };
  },
};

// Types for our app state
interface AppState {
  initialMessage: string;
  uploadedFiles: File[];
}

function App() {
  const [agent, setAgent] = useState<TldrawAgent | undefined>();
  const [page, setPage] = useState<string>("start");
  const [appState, setAppState] = useState<AppState>({
    initialMessage: "",
    uploadedFiles: [],
  });

  // Custom components to visualize what the agent is doing
  const components: TLComponents = useMemo(() => {
    return {
      HelperButtons: () => agent && <CustomHelperButtons agent={agent} />,
      InFrontOfTheCanvas: () => (
        <>
          {agent && <AgentViewportBoundsHighlight agent={agent} />}
          {agent && <ContextHighlights agent={agent} />}
        </>
      ),
    };
  }, [agent]);

  const handleStartSession = (message: string, files: File[]) => {
    setAppState({
      initialMessage: message,
      uploadedFiles: files,
    });
    setPage("board");
  };

  return page === "start" ? (
    <StartScreen onStartSession={handleStartSession} />
  ) : page === "board" ? (
    <TldrawUiToastsProvider>
      <div className="tldraw-agent-container">
        <div className="tldraw-canvas">
          <Tldraw
            persistenceKey="tldraw-agent-demo"
            tools={tools}
            overrides={overrides}
            components={components}
          >
            <AppInner 
              setAgent={setAgent} 
              appState={appState}
            />
          </Tldraw>
        </div>
        <ErrorBoundary fallback={ChatPanelFallback}>
          {agent && <ChatPanel agent={agent} />}
        </ErrorBoundary>
      </div>
    </TldrawUiToastsProvider>
  ) : (
    <div>Not found</div>
  );
}

// Start Screen Component with file upload functionality
function StartScreen({ onStartSession }: { 
  onStartSession: (message: string, files: File[]) => void 
}) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = e.target.files;
      const newFiles: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        if (fileList[i]) {
          newFiles.push(fileList[i]);
        }
      }
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (message.trim() || files.length > 0) {
      onStartSession(message, files);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  const getFileIcon = (file: File) => {
    if (file.type.indexOf("image/") === 0) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-900">
      {/* Welcome Text */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          Welcome to <span className="text-blue-400">REALLY SMART BOARD</span>
        </h1>
        <p className="text-zinc-400 text-lg">
          Start by describing what you want to create or upload files to get started
        </p>
      </div>

      {/* Input Container */}
      <div className="w-full max-w-3xl px-4">
        {/* Uploaded Files Display */}
        {files.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white"
              >
                {getFileIcon(file)}
                <span className="max-w-[200px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-1 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="relative flex flex-col rounded-2xl bg-zinc-800 p-4 shadow-lg ring-1 ring-zinc-700">
          <div className="flex items-end gap-2">
            {/* Attachment Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.txt,.doc,.docx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="max-h-[200px] min-h-[40px] flex-1 resize-none border-none bg-transparent text-white placeholder-zinc-400 focus:outline-none focus:ring-0"
              placeholder="Describe what you want to create..."
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={!message.trim() && files.length === 0}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:bg-zinc-600 disabled:cursor-not-allowed"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>

          {/* Helper text */}
          <div className="mt-2 text-xs text-zinc-500">
            Press Enter to submit, Shift+Enter for new line
          </div>
        </div>

        {/* Quick Start Options */}
        <div className="mt-6 text-center">
          <p className="mb-3 text-sm text-zinc-500">Or try a quick start:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => onStartSession("Create a brainstorming board for a new app idea", [])}
              className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
            >
              🧠 Brainstorm Board
            </button>
            <button
              onClick={() => onStartSession("Create a project planning board", [])}
              className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
            >
              📋 Project Plan
            </button>
            <button
              onClick={() => onStartSession("Create a mind map", [])}
              className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
            >
              🗺️ Mind Map
            </button>
          </div>
        </div>

        {/* Clear Data Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to delete all saved data? This cannot be undone.")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            🗑️ Clear All Saved Data
          </button>
        </div>
      </div>
    </div>
  );
}

function AppInner({ 
  setAgent, 
  appState 
}: { 
  setAgent: (agent: TldrawAgent) => void;
  appState: AppState;
}) {
  const editor = useEditor();
  const agent = useTldrawAgent(editor, AGENT_ID);
  const initialPromptSentRef = useRef(false);

  useEffect(() => {
    if (!editor || !agent) return;
    setAgent(agent);
    (window as any).editor = editor;
    (window as any).agent = agent;
  }, [agent, editor, setAgent]);

  // Send the initial message and files to the agent when ready
  useEffect(() => {
    // Check if we've already sent the initial prompt
    if (!agent || !editor || initialPromptSentRef.current) return;
        if (!appState.initialMessage.trim()) return;
        initialPromptSentRef.current = true;
    
    let message = appState.initialMessage;
    
    if (appState.uploadedFiles.length > 0) {
      const fileNames = appState.uploadedFiles.map(f => f.name).join(", ");
      message = `${appState.initialMessage}\n\n(Files uploaded: ${fileNames})`;
    }
    
    agent.prompt({
      message: message,
      contextItems: [],
      bounds: editor.getViewportPageBounds(),
      modelName: agent.$modelName.get(),
      selectedShapes: [],
      type: 'user',
    });
  }, [agent, editor, appState.initialMessage, appState.uploadedFiles]);

  return null;
}

export default App;
