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
	logWatch: LogWatch;
	minecraft: Minecraft;
	constructor() {
		//configはトークンを含むためthisに入れない
		const config = <configType>dotenv_config().parsed;
		if (!config) throw Error(".env config could not be loaded.");
		console.log(config);
		console.log("Successfully loaded .env!");
		this.latest_log_path = path.join(config.latest_log_path);
		this.logWatch = new LogWatch(this.latest_log_path);
		this.minecraft = new Minecraft(this.logWatch.event);
	}
}
class Minecraft {
	event: EventEmitter;
	constructor(logWatchEvent: EventEmitter) {
		this.event = new EventEmitter();
		logWatchEvent.on("change_diff", (texts: string[]) => {
			const log_regex = /^\[(.*?)\] \[(.*?)\]: (.*)$/;
			const chat_regex = /^<(.*?)>\s(.*?)$/;
			const cmd_regex = /^<(.*?)>\s(.*?)$/;
			const join_regex = /^(.*?)\sjoined\sthe\sgame$/;
			const leave_regex = /^(.*?)\sleft\sthe\sgame$/;
			for (let text of texts) {
				const log_match = text.match(log_regex);

				if (log_match !== null && !log_match.includes("")) {
					const time = log_match[1];
					const info = log_match[2];
					const args = log_match[3];
					this.event.emit(info.replace("Server thread/", ""), time, info, args); //INFO,WARN,DEBUG,...
					const chat_match = args.match(chat_regex); //chat
					if (chat_match !== null && !chat_match.includes("")) {
						const playerName = chat_match[1];
						const message = chat_match[2];
						this.event.emit("chat", time, info, playerName, message); //chat event
					}
					const cmd_match = args.match(cmd_regex); //command
					if (cmd_match !== null && !cmd_match.includes("")) {
						const playerName = cmd_match[1];
						const message = cmd_match[2];
						this.event.emit("command", time, info, playerName, message); //command event
					}
					const join_match = args.match(join_regex); //join
					if (join_match !== null && !join_match.includes("")) {
						const playerName = join_match[1];
						this.event.emit("join", time, info, playerName); //join event
					}
					const leave_match = args.match(leave_regex); //leave
					if (leave_match !== null && !leave_match.includes("")) {
						const playerName = leave_match[1];
						this.event.emit("leave", time, info, playerName); //leave event
					}
				} else {
					console.log(`No match found:${text}`);
				}
			}
		});
	}
}

class LogWatch {
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

new Main();
