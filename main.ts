import {Notice, Plugin, WorkspaceLeaf} from 'obsidian';
import {TimelineView, VIEW_TYPE_VIS} from './view'
import {DataStore} from "./data";
import localizedFormat from "dayjs/plugin/localizedFormat";
import dayjs from "dayjs";
import {dateParserExtension} from "./editor";

dayjs.extend(localizedFormat);

const BLOCK_CSS_CLASS = "timeline-definition-block";

export default class TimelinePlugin extends Plugin {
	private data: DataStore;

	async onload() {
		this.data = new DataStore(this);
		await this.data.onload();

		this.registerView(VIEW_TYPE_VIS,
			(leaf: WorkspaceLeaf) => new TimelineView(leaf)
		);

		this.registerEditorExtension([
			dateParserExtension
		])

		this.registerMarkdownCodeBlockProcessor('time', (source, element, ctx) => {
			this.data.refresh_data();

			const parsed_data = DataStore.parse_block_to_data(source);
			if (parsed_data.isOk) {
				const {start, end, name} = parsed_data.value;
				if (end != undefined) {
					element.createEl('p', {
						'text': `${name}: ${start.format('LLL')} -> ${end.format('LLL')}`,
						cls: BLOCK_CSS_CLASS
					});
				} else {
					element.createEl('p', {'text': `${name}: ${start.format('LLL')}`, cls: BLOCK_CSS_CLASS});
				}
			} else {
				new Notice(`Failed to parse time event data at ${ctx.sourcePath}`);
				element.createEl('p', {'text': 'Failed to parse time event data.'});
			}
		});

		this.addRibbonIcon('chart-no-axes-gantt', 'Timeline', () => {
			this.activate_view();
		});

		this.addCommand({
			name: 'Open Timeline', icon: "chart-no-axes-gantt", id: "opentimeline", callback: () => {
				this.activate_view();
			}
		});
	}

	async activate_view() {
		await this.data.refresh_data();

		const {workspace} = this.app;

		// If view is already open, bring it to focus
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_VIS)[0];

		if (!leaf) {
			// Create new leaf in the middle
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({
				type: VIEW_TYPE_VIS,
				active: true,
			});
		}

		// Reveal and focus the leaf
		await workspace.revealLeaf(leaf);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_VIS);
	}
}
