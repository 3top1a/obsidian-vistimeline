import {IconName, ItemView, WorkspaceLeaf} from 'obsidian';
import {Timeline} from 'vis-timeline/esnext'
import {DataSet} from "vis-data";
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import './graph.css';

export const VIEW_TYPE_VIS = 'vistimeline';

export class TimelineView extends ItemView {
	private timeline: Timeline;


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
		const timeline_div = container.createDiv('timeline');

		// Create a DataSet (allows two-way data-binding)
		const items = new DataSet([
			{id: 1, content: 'item 1', start: '2014-04-20'},
			{id: 2, content: 'item 2', start: '2014-04-14'},
			{id: 3, content: 'item 3', start: '2014-04-18'},
			{id: 4, content: 'item 4', start: '2014-04-16', end: '2014-04-19'},
			{id: 5, content: 'item 5', start: '2014-04-25'},
			{id: 6, content: 'item 6', start: '2014-04-27', type: 'point'}
		]);

		// Configuration for the Timeline
		const options = {
			width: '100%',
		};

		// Create a Timeline
		this.timeline = new Timeline(timeline_div, items, options);
	}

	async onClose() {
		// Nothing to clean up.
	}
}
