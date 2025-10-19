import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { useValue } from 'tldraw'
import { convertTldrawShapeToSimpleShape } from '../../shared/format/convertTldrawShapeToSimpleShape'
import { TldrawAgent } from '../agent/TldrawAgent'
import { ChatHistory } from './chat-history/ChatHistory'
import { ChatInput } from './ChatInput'
import { TodoList } from './TodoList'

export function ChatPanel({ agent }: { agent: TldrawAgent }) {
	const { editor } = agent
	const inputRef = useRef<HTMLTextAreaElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const modelName = useValue(agent.$modelName)

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		async (e) => {
			e.preventDefault()
			if (!inputRef.current) return
			const formData = new FormData(e.currentTarget)
			const value = formData.get('input') as string

			// If the user's message is empty, just cancel the current request (if there is one)
			if (value === '') {
				agent.cancel()
				return
			}

			// If every todo is done, clear the todo list
			const todosRemaining = agent.$todoList.get().filter((item) => item.status !== 'done')
			if (todosRemaining.length === 0) {
				agent.$todoList.set([])
			}

			// Grab the user query and clear the chat input
			const message = value
			const contextItems = agent.$contextItems.get()
			agent.$contextItems.set([])
			inputRef.current.value = ''

			// Prompt the agent
			const selectedShapes = editor
				.getSelectedShapes()
				.map((shape) => convertTldrawShapeToSimpleShape(editor, shape))

			await agent.prompt({
				message,
				contextItems,
				bounds: editor.getViewportPageBounds(),
				modelName,
				selectedShapes,
				type: 'user',
			})
		},
		[agent, modelName, editor]
	)

	const [showMenu, setShowMenu] = useState(false)

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowMenu(false)
			}
		}

		if (showMenu) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [showMenu])

	function handleNewChat() {
		agent.reset()
		setShowMenu(false)
	}

	function handleClearAllData() {
		if (window.confirm("Are you sure you want to delete all saved data? This will clear the canvas, chat history, and all settings. This cannot be undone.")) {
			localStorage.clear()
			window.location.reload()
		}
		setShowMenu(false)
	}

	function NewChatButton() {
		return (
			<div className="relative" ref={menuRef}>
				<button 
					className="new-chat-button" 
					onClick={() => setShowMenu(!showMenu)}
					title="Reset chat or clear all data"
				>
					⋮
				</button>
				{showMenu && (
					<div 
						className="absolute top-full right-0 mt-2 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 overflow-hidden z-50"
						style={{ minWidth: '200px' }}
					>
						<button
							onClick={handleNewChat}
							className="w-full px-4 py-3 text-left text-sm text-white hover:bg-zinc-700 transition-colors flex items-center gap-2"
						>
							<span>🔄</span>
							<span>New Chat</span>
						</button>
						<button
							onClick={handleClearAllData}
							className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-zinc-700 transition-colors flex items-center gap-2 border-t border-zinc-700"
						>
							<span>🗑️</span>
							<span>Clear All Data</span>
						</button>
					</div>
				)}
			</div>
		)
	}

	return (
		<div className="chat-panel tl-theme__dark">
			<div className="chat-header">
				<NewChatButton />
			</div>
			<ChatHistory agent={agent} />
			<div className="chat-input-container">
				<TodoList agent={agent} />
				<ChatInput agent={agent} handleSubmit={handleSubmit} inputRef={inputRef} />
			</div>
		</div>
	)
}
