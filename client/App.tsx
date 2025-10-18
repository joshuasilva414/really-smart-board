import { useEffect, useMemo, useState } from "react";
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
import { Paperclip, ArrowUp } from "lucide-react";

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

function App() {
  const [agent, setAgent] = useState<TldrawAgent | undefined>();
  const [page, setPage] = useState<string>("start");

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

  return page === "start" ? (
    <div className="flex h-screen w-screen flex-col items-center justify-end bg-zinc-900 pb-8">

      {/* Welcome Text */}
      <div className="absolute top-1/4 text-center">
        <h1 className="text-5xl font-bold text-white">
          Welcome to <span className="text-blue-400">REALLY SMART BOARD</span>
        </h1>
      </div>

      {/* The input form container */}
      <div className="fixed bottom-0 left-0 w-full bg-zinc-900/50 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl items-center p-4">
          <div className="relative flex w-full items-center rounded-full bg-zinc-800 p-2 shadow-lg ring-1 ring-zinc-700">

            {/* Attachment Button */}
            <button className="ml-2 flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white">
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Text Input */}
            <textarea
              className="mx-4 flex-1 resize-none self-center border-none bg-transparent text-white placeholder-zinc-400 focus:outline-none focus:ring-0"
              placeholder="Type your message here."
              id="message"
              rows={1}
            />

            {/* Send Button */}
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:bg-zinc-600">
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : page === "learn" ? (
    <TldrawUiToastsProvider>
      <div className="tldraw-agent-container">
        <div className="tldraw-canvas">
          <Tldraw
            persistenceKey="tldraw-agent-demo"
            tools={tools}
            overrides={overrides}
            components={components}
          >
            <AppInner setAgent={setAgent} />
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

function AppInner({ setAgent }: { setAgent: (agent: TldrawAgent) => void }) {
  const editor = useEditor();
  const agent = useTldrawAgent(editor, AGENT_ID);

  useEffect(() => {
    if (!editor || !agent) return;
    setAgent(agent);
    (window as any).editor = editor;
    (window as any).agent = agent;
  }, [agent, editor, setAgent]);

  return null;
}

export default App;
