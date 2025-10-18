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
        <div className="h-screen w-screen bg-zinc-900 flex flex-col justify-center items-center text-white text-2xl">
          <div><h1 className="h-40 text-5xl font-bold">Welcome to <span className="text-blue-400">REALLY SMART BOARD</span></h1></div>
                <div className="align-center h-60 flex flex-col align-top justify-start">
                    <Textarea className="align-top justify-start w-300 bg-red-300 text-black" placeholder="Type your message here." id="message" />
                    <Button className="justify-self-end  bg-blue-500 text-white"></Button>
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
