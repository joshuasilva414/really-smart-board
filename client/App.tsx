import { useEffect, useMemo, useState, useRef } from "react";
import {
  DefaultSizeStyle,
  ErrorBoundary,
  TLComponents,
  Tldraw,
  TldrawUiToastsProvider,
  TLUiOverrides,
  useEditor
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

import StartScreen from "./components/StartScreen";


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
