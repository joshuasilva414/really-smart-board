# Really Smart Board

This is an AI-powered whiteboard built using the tldraw agent starter kit. It demonstrates how to build an AI agent that can manipulate the [tldraw](https://github.com/tldraw/tldraw) canvas.

It features a chat panel on the right-hand-side of the screen where the user can communicate with the agent, add context, and see the chat history.

## Environment Setup

Create a `.env` file in the root directory and add API keys for any model providers you want to use.

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

We recommend using Anthropic for the best results. You can get your API key from the [Anthropic dashboard](https://console.anthropic.com/settings/keys).

## Local Development

Install dependencies with `yarn` or `npm install`.

Run the development server with `yarn dev` or `npm run dev`.

Open `http://localhost:5173/` in your browser to see the app.

## Troubleshooting

For common issues and solutions, please see the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide.

## Agent Overview

With its default configuration, the agent can perform the following actions:

- Create, update, and delete shapes.
- Draw freehand pen strokes.
- Use higher-level operations on multiple shapes at once: Rotate, resize, align, distribute, stack, and reorder shapes.
- Write out its thinking and send messages to the user.
- Keep track of its task by writing and updating a todo list.
- Move its viewport to look at different parts of the canvas.
- Schedule further work and reviews to be carried out in follow-up requests.
- Call example external APIs: Looking up country information, retrieving a random Wikipedia article.

To make decisions on what to do, we send the agent information from various sources:

- The user's message.
- The user's current selection of shapes.
- What the user can currently see on their screen.
- Any additional context that the user has provided, such as specific shapes or a particular position or area on the canvas.
- Actions the user has recently taken.
- A screenshot of the agent's current view of the canvas.
- A simplified format of all shapes within the agent's viewport.
- Information on clusters of shapes outside the agent's viewport.
- The history of the current session, including the user's messages and all the agent's actions.

## Use the Agent Programmatically

Aside from using the chat panel UI, you can also prompt the agent programmatically.

The simplest way to do this is by calling the `prompt()` method to start an agentic loop. The agent will continue until it has finished the task you've given it.

```ts
const agent = useTldrawAgent(editor);
agent.prompt("Draw a cat");
```

You can optionally specify further details about the request in the form of an `AgentInput` object:

```ts
agent.prompt({
  message: "Draw a cat in this area",
  bounds: { x: 0, y: 0, w: 300, h: 400 },
});
```

There are more methods on the `TldrawAgent` class that can help when building an agentic app:

- `agent.cancel()` - Cancel the agent's current task.
- `agent.reset()` - Reset the agent's chat and memory.
- `agent.request(input)` - Send a single request to the agent and handle its response _without_ entering into an agentic loop.

## Customize the Agent

We define the agent's behavior in the `shared/AgentUtils.ts` file. In that file, there are two lists of utility classes:

- `PROMPT_PART_UTILS` determine what the agent can **see**.
- `AGENT_ACTION_UTILS` determine what the agent can **do**.

Add, edit, or remove an entry in either list to change what the agent can see or do.

### Change What the Agent Can See

**Change what the agent can see by adding, editing, or removing a `PromptPartUtil` within `shared/AgentUtils.ts`.**

Prompt part utils assemble and build the prompt that we give to the model, with each util adding a different piece of information. This includes the user's message, the model name, the system prompt, chat history, and more.

This example shows how to let the model see what the current time is.

First, define a prompt part in `shared/types/BasePromptPart.ts`:

```ts
interface TimePart extends BasePromptPart<"time"> {
  time: string;
}
```

Then, create a prompt part util in `shared/parts/TimePartUtil.ts`:

```ts
export class TimePartUtil extends PromptPartUtil<TimePart> {
  static override type = "time" as const;

  override getPart(): TimePart {
    return {
      type: "time",
      time: new Date().toLocaleTimeString(),
    };
  }

  override buildContent({ time }: TimePart) {
    return ["The user's current time is:", time];
  }
}
```

To enable the prompt part, add its util to the `PROMPT_PART_UTILS` list in `shared/AgentUtils.ts`. It will use its methods to assemble its data and send it to the model.

- `getPart` - Gather any data needed to construct the prompt.
- `buildContent` - Turn the data into messages to send to the model.

There are other methods available on the `PromptPartUtil` class that you can override for more granular control.

### Change What the Agent Can Do

**Change what the agent can do by adding, editing, or removing an `AgentActionUtil` within `shared/AgentUtils.ts`.**

Agent action utils define the actions the agent can perform. Each `AgentActionUtil` adds a different capability.

This example shows how to allow the agent to clear the screen.

First, define an agent action by creating a schema for it:

```ts
const ClearAction = z
  .object({
    _type: z.literal("clear"),
  })
  .meta({
    title: "Clear",
    description: "The agent deletes all shapes on the canvas.",
  });

type ClearAction = z.infer<typeof ClearAction>;
```

Create an agent action util:

```ts
export class ClearActionUtil extends AgentActionUtil<ClearAction> {
  static override type = "clear" as const;

  override getSchema() {
    return ClearAction;
  }

  override applyAction(action: Streaming<ClearAction>) {
    if (!action.complete) return;
    if (!this.agent) return;
    const { editor } = this.agent;
    const shapes = editor.getCurrentPageShapes();
    editor.deleteShapes(shapes);
  }
}
```

To enable the agent action, add its util to the `AGENT_ACTION_UTILS` list in `shared/AgentUtils.ts`. Its methods will be used to define and execute the action.

- `getSchema` - Get the schema the model should follow to carry out the action.
- `applyAction` - Execute the action.

### Change How Actions Appear in Chat History

Configure the icon and description of an action in the chat panel UI using the `getInfo()` method.

```ts
override getInfo() {
    return {
        icon: 'trash' as const,
        description: 'Cleared the canvas',
    }
}
```

### Schedule Further Work

You can let the agent work over multiple turns by scheduling further work using the `schedule` method as part of an action.

```ts
override applyAction(action: Streaming<AddDetailAction>) {
    if (!action.complete) return
    if (!this.agent) return
    this.agent.schedule('Add more detail to the canvas.')
}
```

### Retrieve Data from an External API

To let the agent retrieve information from an external API, fetch the data within `applyAction` and schedule a follow-up request with any data you want the agent to have access to.

```ts
override async applyAction(action: Streaming<RandomWikipediaArticleAction>) {
    if (!action.complete) return
    if (!this.agent) return

    const article = await fetchRandomWikipediaArticle()
    this.agent.schedule({ data: [article] })
}
```

### Sanitize Data Received from the Model

The model can make mistakes. To correct incoming mistakes, apply fixes in the `sanitizeAction` method of an action util.

```ts
override sanitizeAction(action: Streaming<DeleteAction>, helpers: AgentHelpers) {
    if (!action.complete) return action
    action.shapeId = helpers.ensureShapeIdExists(action.shapeId)
    if (!action.shapeId) return null
    return action
}
```

### Support Custom Shapes

If your app includes [custom shapes](https://tldraw.dev/docs/shapes#Custom-shapes-1), the agent will be able to see, move, delete, resize, rotate, and arrange them with no extra setup. To enable creation and editing, you can either add a new action or add your custom shape to the `SimpleShape.ts` schema.

## License

This project is part of the tldraw SDK. It is provided under the [tldraw SDK license](https://github.com/tldraw/tldraw/blob/main/LICENSE.md).

You can use the tldraw SDK in commercial or non-commercial projects so long as you preserve the "Made with tldraw" watermark on the canvas. To remove the watermark, you can purchase a [business license](https://tldraw.dev#pricing).

## Trademarks

Copyright (c) 2025-present tldraw Inc. The tldraw name and logo are trademarks of tldraw. Please see our [trademark guidelines](https://github.com/tldraw/tldraw/blob/main/TRADEMARKS.md) for info on acceptable usage.

## Community

Have questions, comments or feedback? [Join our discord](https://discord.gg/rhsyWMUJxd).

## Contact

Find us on Twitter/X at [@tldraw](https://twitter.com/tldraw) or email us at [hello@tldraw.com](mailto:hello@tldraw.com).
