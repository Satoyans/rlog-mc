import { config as dotenv_config } from "dotenv";
import { DiscordEventEmitter, LogWatch, MinecraftEventEmitter, configType } from "./modules";
import { Client, GatewayIntentBits, Message, Partials } from "discord.js";
import * as request from "request";
import * as sharp from "sharp";

class Main {
	minecraft: MinecraftEventEmitter;
	discord: DiscordEventEmitter;
	getMcIcon: (playerName: string) => Promise<Buffer>;
	constructor() {
		//configはトークンを含むためthisに入れない
		const config = <configType>dotenv_config().parsed;
		if (!config) throw Error(".env config could not be loaded.");
		console.log(config);
		console.log("Successfully loaded .env!");
		const minecraft = new Minecraft(config);
		const discord = new Discord(config);
		this.minecraft = minecraft.event;
		this.getMcIcon = minecraft.getIcon;
		this.discord = discord.event;
	}
}
class Minecraft {
	event: MinecraftEventEmitter;
	constructor(config: configType) {
		const logWatch = new LogWatch(config);
		this.event = new MinecraftEventEmitter();
		logWatch.event.on("change_diff", (texts: string[]) => {
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
		});
	}
	async getIcon(playerName: string) {
		const get = (uri: string, options?: request.CoreOptions): Promise<request.Response> => {
			return new Promise((resolve, reject) => {
				request.get(uri, options, (err, res) => {
					if (err) return reject(err);
					return resolve(res);
				});
			});
		};

		const res1 = await get(`https://api.mojang.com/users/profiles/minecraft/${playerName}`);
		const body1 = JSON.parse(res1.body);
		const res2 = await get(`https://sessionserver.mojang.com/session/minecraft/profile/${body1.id}`);
		const body2 = JSON.parse(res2.body);
		const skin_url_base64 = body2.properties[0].value;
		const skin_url_str = Buffer.from(skin_url_base64, "base64").toString();
		const skin_url = JSON.parse(skin_url_str).textures.SKIN.url;
		const res3 = await get(skin_url, { encoding: null });
		const skin_buffer = await sharp(res3.body).resize({ width: 64 }).toBuffer();
		const base_face_buffer = await sharp(skin_buffer)
			.extract({
				left: 40,
				top: 8,
				width: 8,
				height: 8,
			})
			.toBuffer();
		const face_buffer = await sharp(skin_buffer)
			.extract({
				left: 8,
				top: 8,
				width: 8,
				height: 8,
			})
			.composite([{ input: base_face_buffer, blend: "over" }])
			.toBuffer();
		return face_buffer;
		//sharp(face_buffer).toFile(path.join(__dirname, `./${playerName}.png`));//export
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
		this.send = this.sendMessage.bind(this);
	}
	private async messageCreate(message: Message) {
		if (message.channelId !== this.channel_id) return;
		if (message.author.bot) return;
		this.event.emit("chat", message);
	}
	private async sendMessage(playerName: string, message: string, avatar_url?: string) {
		const body = {
			username: playerName,
			content: message,
		};
		avatar_url ? (body["avatar_url"] = avatar_url) : null;
		request.post(
			{
				url: this.channel_webhook,
				body: body,
				headers: { "content-type": "application/json; charset=utf-8" },
				json: true,
			},
			(err, res) => {
				if (err) {
					console.error(err);
				}
			}
		);
	}
}

export const rlog = new Main();
import "./plugins/loader";
