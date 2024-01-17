import { EventEmitter } from "events";
import * as path from "path";
import * as fs from "fs";
import { Message } from "discord.js";

export class MinecraftEventEmitter extends EventEmitter {
	public emit(event: "chat", time: string, info: string, playerName: string, message: string): boolean;
	public emit(event: "command", time: string, info: string, result: string): boolean;
	public emit(event: "join", time: string, info: string, playerName: string): boolean;
	public emit(event: "leave", time: string, info: string, playerName: string): boolean;
	public emit(event: minecraftEventType, ...args: any[]) {
		return super.emit(event, ...args);
	}

	public on(event: "chat", func: (time: string, info: string, playerName: string, message: string) => void): this;
	public on(event: "command", func: (time: string, info: string, result: string) => void): this;
	public on(event: "join", func: (time: string, info: string, playerName: string) => void): this;
	public on(event: "leave", func: (time: string, info: string, playerName: string) => void): this;
	public on(eventName: minecraftEventType, func: (...arg: any) => void) {
		return super.on(eventName, func);
	}
}

export class DiscordEventEmitter extends EventEmitter {
	public emit(event: "chat", message: Message): boolean;
	public emit(event: discordEventType, ...args: any[]) {
		return super.emit(event, ...args);
	}

	public on(event: "chat", func: (message: Message) => void): this;
	public on(eventName: discordEventType, func: (...arg: any) => void) {
		return super.on(eventName, func);
	}
}

export class LogWatch {
	latest_log_path: string;
	event: EventEmitter;
	on: (eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
	check_interval_ms: number;
	last_size: number;
	last_text: string;
	constructor(config: configType) {
		this.latest_log_path = path.join(config.latest_log_path);
		this.check_interval_ms = 1000; //チェック間隔(ms)
		this.event = new EventEmitter();
		this.chengeEventAfter();
		this.checkLogfile();
		console.log("watch log file path:" + this.latest_log_path);
		this.event.on("change", this.chengeEventAfter.bind(this));

		this.last_size = 0;
		this.last_text = Array(100).fill('"').join("'"); //なさそうな文字列
	}

	private checkLogfile() {
		const check = () => {
			const size = fs.statSync(this.latest_log_path).size;
			if (this.last_size < size && this.last_size !== 0) {
				this.event.emit("change");
			}
			this.last_size = size;
		};
		setInterval(check, this.check_interval_ms);
	}
	private chengeEventAfter() {
		const stream = fs.createReadStream(this.latest_log_path);
		let chunks: Buffer[] = [];
		stream
			.on("data", (chunk: Buffer) => {
				chunks.push(chunk);
			})
			.on("end", () => {
				const buffer = Buffer.concat(
					chunks,
					chunks.reduce((sum, chunk) => (sum += chunk.length), 0)
				);
				const text = buffer.toString("utf-8");
				const split_text1 = text.split(this.last_text);
				const split_text2 = split_text1[split_text1.length - 1].split("\r\n");
				split_text2.pop();
				this.last_text = text;
				if (this.last_size === 0) return;
				this.event.emit("change_diff", split_text2);
			});
	}
}

export type configType = {
	latest_log_path: string;
	discord_bot_token: string;
	discord_chat_channel_id: string;
	discord_chat_channel_webhook: string;
	rcon_host: string;
	rcon_port: string;
	rcon_password: string;
};

export type discordEventType = "chat";

export type minecraftEventType = "chat" | "command" | "join" | "leave";
