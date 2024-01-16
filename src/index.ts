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
		this.latest_log_path = path.join(config.latest_log_path);
		this.logWatch = new logWatch(this.latest_log_path);
	}
}

class logWatch {
	latest_log_path: string;
	event: EventEmitter;
	on: (eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
	constructor(path: string) {
		this.latest_log_path = path;
		this.event = new EventEmitter();
		this.on = this.event.on;
		this.watchLogfile();
	}

	private watchLogfile() {
		const FSwatcher = fs.watch(this.latest_log_path);
		FSwatcher.on("change", (event_type, filename) => {
			fs.readFile(this.latest_log_path, (err, data) => {
				console.log(data);
			});
		});
	}
}

new Main();
