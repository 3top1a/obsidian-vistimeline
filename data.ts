import {parseYaml, Plugin, TFile} from 'obsidian';
import dayjs from "dayjs";
// @ts-ignore
import {err, ok, Result} from "true-myth/result"

export interface TimeEventData {
	name: string,
	start: dayjs.Dayjs,
	end?: dayjs.Dayjs,
	group?: string,
	type?: 'box' | 'point' | 'range' | 'background',
}

export interface Data {
	filename: TFile,
	content: string,
	data: Result<TimeEventData>,
}

function extractCodeBlocks(markdown: string) {
	// Matches both ``` and ~~~~ style code blocks
	const regex = /```time[\s\S]*?```/g;
	return markdown.match(regex) || [];
}

export class DataStore {
	private plugin: Plugin;
	private data: Data[];
	// Because of the architecture of Obsidian, in order for
	// the view to get the data it needs to be in a singleton
	private static instance: DataStore;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
		DataStore.instance = this;
	}

	// Get data from the singleton
	public static getData(): Data[] {
		return DataStore.instance.data;
	}

	async onload() {
		await this.reload_from_cache();
	}

	parse_date(input: string | null): dayjs.Dayjs | undefined {
		if (input == "" || input == null) {
			return undefined;
		}
		if (input == "now") {
			return dayjs();
		}
		const date = dayjs(input);
		if (date.isValid()) {
			return date;
		}
		return undefined;
	}

	// Parse MarkDown block to a TimeEventData
	// Returns a string with an error message in case of error
	parse_block_to_data(input: string): Result<TimeEventData, {message: string}> {
		const block = input.replace(/```time/g, "").replace(/```/g, "").trim();
		const parsed_data = parseYaml(block);

		if (parsed_data) {
			const start = this.parse_date(parsed_data.start);
			const end = this.parse_date(parsed_data.end);
			const name: string | undefined = parsed_data.name;
			const group: string | undefined = parsed_data.group;
			const type: string | undefined = parsed_data.type;

			if (start == undefined) {
				return err({message: "Start is not defined"});
			}
			if (end == undefined && (type == 'range' || type == 'background')) {
				return err({message: "End is not defined"});
			}
			if (name == undefined || name == "") {
				return err({message: "Name is not defined"});
			}

			return ok({
				start: start,
				end: end,
				name: name,
				group: group,
				type: type,
			});
		}

		return err({message: "Unable to find any code block"});
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
	}
}
