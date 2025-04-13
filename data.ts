import {Plugin, MarkdownView, MarkdownRenderer, TFile, parseYaml} from 'obsidian';

export interface ParsedData {
	start: string,
	end: string,
}

export interface Data {
	filename: TFile,
	content: string,
	data: ParsedData,
}

export class DataStore {
	private plugin: Plugin;
	private data: Data[];

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	async onload() {
		await this.reload_from_cache();
	}

	async reload_from_cache() {
		const markdownFiles = this.plugin.app.vault.getMarkdownFiles();

		const timeBlocks: Data[] = [];

		for (const file of markdownFiles) {
			const cache = this.plugin.app.metadataCache.getFileCache(file);

			if (!cache) continue;
			if (!cache?.sections) continue;

			console.debug(cache);

			for (const section of cache.sections) {
				if (section.type !== 'code') continue;

				const content = await this.plugin.app.vault.cachedRead(file);

				const blockContent = content.slice(section.position.start.offset, section.position.end.offset).trim();

				if (!blockContent.startsWith("```time")) continue;
				if (!blockContent.endsWith("```")) continue;
\`\`\`text([\n.]*)```
				const block = content.replace("```time", "").replace("```", "").trim();
				console.debug(section, block)
				const parsed_data: ParsedData = parseYaml(block);

				timeBlocks.push({
					content: block,
					filename: file,
					data: parsed_data,
				})
			}
		}

		this.data = timeBlocks;
		console.debug(this.data)
	}
}
