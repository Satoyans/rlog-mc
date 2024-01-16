import { EventEmitter } from "events";
import * as fs from "fs";
import { createInterface } from "readline";
import { config as dotenv_config } from "dotenv";
import * as path from "path";

type configType = {
	latest_log_path: string;
	discord_bot_token: string;
	discord_chat_channel_id: string;
	discord_chat_channel_webhook: string;
	rcon_host: string;
	rcon_post: string;
	rcon_password: string;
};
class Main {
	latest_log_path: string;
	logWatch: logWatch;
	constructor() {
		//configはトークンを含むためthisに入れない
		const config = <configType>dotenv_config().parsed;
		if (!config) throw Error(".env config could not be loaded.");
		console.log(config);
		console.log("Successfully loaded .env!");
		this.latest_log_path = path.join(config.latest_log_path);
		this.logWatch = new logWatch(this.latest_log_path);
	}
}

class logWatch {
	latest_log_path: string;
	event: EventEmitter;
	on: (eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
	check_interval_ms: number;
	last_size: number;
	last_text: string;
	constructor(path: string) {
		this.latest_log_path = path;
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

const main = new Main();
export const event = main.logWatch.event;
