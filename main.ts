import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf} from 'obsidian';
import {TimelineView, VIEW_TYPE_VIS} from './view'
import {DataStore} from "./data";

export default class TimelinePlugin extends Plugin {
	private data: DataStore;

	async onload() {
		this.data = new DataStore(this);
		await this.data.onload();

		this.registerView(VIEW_TYPE_VIS,
			(leaf: WorkspaceLeaf) => new TimelineView(leaf)
		);

		this.registerMarkdownCodeBlockProcessor('time', (source, element, ctx) => {
			// TODO Parse and display info

			element.createEl('p', {'text': source})
		});

		this.addRibbonIcon('chart-no-axes-gantt', 'Timeline', () => {
			this.activate_view();
		});

	}

	async activate_view() {
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
