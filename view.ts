import {IconName, ItemView, WorkspaceLeaf} from 'obsidian';
import {Timeline} from 'vis-timeline/esnext'
import {DataSet} from "vis-data";
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import './graph.css';
import {DataStore} from "./data";

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

		const items = this.get_dataset();

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

	get_dataset(): DataSet<any> {
		const data = DataStore.getData();
		const output = new DataSet({});

		let index = 0;
		data.forEach((item) => {
			console.debug(item);
			const data = item.data.value;
			output.add([{
				id: index,
				// @ts-ignore
				content: data.name,
				start: data.start?.toISOString(),
				end: data.end?.toISOString(),
				type: data.type,
				group: data.group,
			}]);

			index += 1;
		});

		console.info(output);

		return output;
	}
}
