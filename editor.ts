import {Extension} from "@codemirror/state"
import {ViewPlugin, DecorationSet, Decoration, EditorView, WidgetType} from "@codemirror/view"
import {syntaxTree} from "@codemirror/language"
import {DataStore} from "./data";

class DateWidget extends WidgetType {
	constructor(private readonly parsedDate: string) {
		super()
	}

	toDOM() {
		const span = document.createElement("span");
		span.className = "cm-parsed-date";
		span.style.opacity = "0.5";
		span.style.marginLeft = "8px";
		span.textContent = `(${this.parsedDate})`;
		return span
	}
}

class ErrorWidget extends WidgetType {
	constructor(private readonly error: string) {
		super()
	}

	toDOM() {
		const span = document.createElement("span");
		span.className = "cm-time-block-error";
		span.style.marginLeft = "8px";
		span.textContent = this.error;
		return span
	}
}

function parseDateValue(value: string): string {
	const d = DataStore.parse_date(value);
	if (d == undefined) {
		return "Invalid Date"
	}
	return d?.isValid() ? d?.toISOString() : "Invalid Date"
}

export const dateParserExtension: Extension = ViewPlugin.fromClass(class {
	decorations: DecorationSet

	constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view)
	}

	update(update: any) {
		if (update.docChanged || update.viewportChanged) {
			this.decorations = this.buildDecorations(update.view)
		}
	}

	buildDecorations(view: EditorView) {
		const decorations = []
		const tree = syntaxTree(view.state)

		// For the errors before ```time, it needs to scan and then when it gets to ```
		// parse and display the error
		// A bit hacky but sure
		let codeBlockStart = -1
		let timeBlock = ""

		const iterate = tree.cursor()
		while (iterate.next()) {
			const node = iterate.node
			const line = view.state.doc.lineAt(node.from)
			const text = line.text

			timeBlock += text + "\n"

			// Find code block start
			if (text === "```time") {
				// Set where the ```time line ends
				codeBlockStart = line.to
				timeBlock = "" // Reset time block
				continue
			}

			if (text === "```") {
				if (codeBlockStart === -1) continue

				const parsed = DataStore.parse_block_to_data(timeBlock);
				if (parsed.isOk) {
					codeBlockStart = -1;
					continue;
				}

				decorations.push(Decoration.widget({
					widget: new ErrorWidget(parsed.error.message),
					side: 1
				}).range(codeBlockStart)) // After "```time"
				codeBlockStart = -1;
			}

			// Show parsed dates
			if (node.type.id === 6 && codeBlockStart != -1) {
				// Match start: or end: followed by a value
				const match = text.match(/^(start|end):\s*(.+)$/i)
				if (match) {
					const dateValue = match[2].trim()
					const parsedDate = parseDateValue(dateValue)

					decorations.push(Decoration.widget({
						widget: new DateWidget(parsedDate),
						side: 1
					}).range(line.from + text.length))
				}
			}
		}

		decorations.sort((a, b) => a.from - b.from);
		return Decoration.set(decorations)
	}
}, {
	decorations: v => v.decorations
})
