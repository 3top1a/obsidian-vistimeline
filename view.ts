import {IconName, ItemView, WorkspaceLeaf} from 'obsidian';

export const VIEW_TYPE_VIS = 'vistimeline';

export class TimelineView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_VIS;
	}

	getDisplayText() {
		return 'Timeline';
	}

	getIcon(): IconName {
		return 'chart-no-axes-gantt'
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl('h4', {text: 'Example view'});
	}

	async onClose() {
		// Nothing to clean up.
	}
}
