import {parseYaml, Plugin, TFile} from 'obsidian';
import dayjs from "dayjs";

export interface TimeEventData {
	start: dayjs.Dayjs,
	end: dayjs.Dayjs,
}

export interface Data {
	filename: TFile,
	content: string,
	data: TimeEventData,
}

function extractCodeBlocks(markdown: string) {
	// Matches both ``` and ~~~~ style code blocks
	const regex = /```time[\s\S]*?```/g;
	return markdown.match(regex) || [];
}

export class DataStore {
	private plugin: Plugin;
	private data: Data[];
	private static instance: DataStore;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
		DataStore.instance = this;
	}

	public static getInstance(): DataStore {
        if (!DataStore.instance) {
            throw new Error('DataStore not initialized');
        }
        return DataStore.instance;
    }

	async onload() {
		await this.reload_from_cache();
	}

	parse_date(input: string): dayjs.Dayjs | null {
		if (input == "now") {
			return dayjs();
		}
		const date = dayjs(input);
		if (date.isValid()) {
			return date;
		}
		return null;
	}

	parse_block_to_data(input: string): TimeEventData | null {
		const block = input.replace(/```time/g, "").replace(/```/g, "").trim();
		const parsed_data = parseYaml(block);

		if (parsed_data && typeof parsed_data === 'object' && 'start' in parsed_data && 'end' in parsed_data) {
			const start = this.parse_date(parsed_data.start);
			const end = this.parse_date(parsed_data.end);
			if (!start || !end) {
				return null;
			}

			return {
				start: start,
				end: end,
			};
		}

		return null;
	}

	async reload_from_cache() {
		const markdownFiles = this.plugin.app.vault.getMarkdownFiles();

		const timeBlocks: Data[] = [];

		for (const file of markdownFiles) {
			const cache = this.plugin.app.metadataCache.getFileCache(file);

			if (!cache) continue;
			if (!cache?.sections) continue;

			for (const section of cache.sections) {
				if (section.type !== 'code') continue;

				const content = await this.plugin.app.vault.cachedRead(file);

				const blockContent = content.slice(section.position.start.offset, section.position.end.offset).trim();

				const matches = extractCodeBlocks(blockContent);
				for (const match of matches) {
					const parsed_data = this.parse_block_to_data(match);
					if (!parsed_data) continue;
					timeBlocks.push({
						content: match,
						filename: file,
						data: parsed_data,
					})
				}
			}
		}

		this.data = timeBlocks;
		console.debug(this.data)
	}
}
