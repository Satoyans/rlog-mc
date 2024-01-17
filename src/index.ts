import { config as dotenv_config } from "dotenv";
import { DiscordEventEmitter, LogWatch, MinecraftEventEmitter, configType } from "./modules";
import { AttachmentBuilder, Client, EmbedBuilder, GatewayIntentBits, Message, Partials, WebhookClient } from "discord.js";
import * as request from "request";
import * as sharp from "sharp";
import { Rcon as RCONClient } from "rcon-client";
import * as path from "path";

class Main {
	minecraft: MinecraftEventEmitter;
	discord: DiscordEventEmitter;
	getMcIcon: (playerName: string) => Promise<string>;
	rcon: Rcon;
	constructor() {
		//configはトークンを含むためthisに入れない
		const config = <configType>dotenv_config().parsed;
		if (!config) throw Error(".env config could not be loaded.");
		console.log(config);
		console.log("Successfully loaded .env!");
		const minecraft = new Minecraft(config);
		const discord = new Discord(config);
		const rcon = new Rcon(config);
		this.minecraft = minecraft.event;
		this.discord = discord.event;
		this.rcon = rcon;
	}
}
class Minecraft {
	event: MinecraftEventEmitter;

	constructor(config: configType) {
		const logWatch = new LogWatch(config);
		this.event = new MinecraftEventEmitter();
		this.event.getIcon = this.getIcon.bind(this);
		logWatch.event.on("change_diff", this.change_diff.bind(this));
	}
	async getIcon(playerName: string) {
		return `https://mc-heads.net/avatar/${playerName}/64`;
	}

	change_diff(texts: string[]) {
		const log_regex = /^\[(.*?)\] \[(.*?)\]: (.*)$/;
		const chat_regex = /^<(.*?)>\s(.*?)$/;
		const cmd_regex = /^[(.*?)]$/;
		const join_regex = /^(.*?)\sjoined\sthe\sgame$/;
		const leave_regex = /^(.*?)\sleft\sthe\sgame$/;
		for (let text of texts) {
			const log_match = text.match(log_regex);

			if (log_match !== null && !log_match.includes("")) {
				const time = log_match[1];
				const info = log_match[2];
				const args = log_match[3];
				//this.event.emit(info.replace("Server thread/", ""), time, info, args); //INFO,WARN,DEBUG,...
				const chat_match = args.match(chat_regex); //chat
				if (chat_match !== null && !chat_match.includes("")) {
					const playerName = chat_match[1];
					const message = chat_match[2];
					this.event.emit("chat", time, info, playerName, message); //chat event
				}
				const cmd_match = args.match(cmd_regex); //command
				if (cmd_match !== null && !cmd_match.includes("")) {
					const result = cmd_match[1];
					this.event.emit("command", time, info, result); //command event
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
	}
}

class Discord {
	event: DiscordEventEmitter;
	client: Client<boolean>;
	channel_id: string;
	channel_webhook: string;
	send: (playerName: string, message: string, avatar_url?: string) => Promise<void>;

	constructor(config: configType) {
		this.event = new DiscordEventEmitter();
		this.client = new Client({
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
			partials: [Partials.Channel],
		});
		this.channel_id = config.discord_chat_channel_id;
		console.log(config.discord_chat_channel_id);
		this.channel_webhook = config.discord_chat_channel_webhook;
		this.client.login(config.discord_bot_token);
		this.client.on("ready", async () => {
			console.log("discord bot started!");
		});
		this.client.on("messageCreate", this.messageCreate.bind(this));
		this.event.send = this.sendMessage.bind(this);
	}
	private async messageCreate(message: Message) {
		if (message.channelId !== this.channel_id) return;
		if (message.author.bot) return;
		this.event.emit("chat", message);
	}
	private async sendMessage(playerName: string, message: string, avatar_url?: string) {
		const webhookClient = new WebhookClient({ url: this.channel_webhook });
		console.log(avatar_url);
		webhookClient.send({
			username: playerName,
			content: message,
			avatarURL: avatar_url,
		});
	}
}

class Rcon {
	rcon_host: string;
	rcon_password: string;
	rcon_port: number;
	rcon_client: RCONClient;
	constructor(config: configType) {
		this.rcon_host = config.rcon_host;
		this.rcon_password = config.rcon_password;
		this.rcon_port = Number(config.rcon_port);
	}
	async send(command: string) {
		const rcon = await RCONClient.connect({
			host: this.rcon_host,
			port: this.rcon_port,
			password: this.rcon_password,
		});
		const result = await rcon.send(command);
		rcon.end();
		return result;
	}
}

export const rlog = new Main();
import "./plugins/loader";
