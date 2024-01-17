import { config as dotenv_config } from "dotenv";
import { DiscordEventEmitter, LogWatch, MinecraftEventEmitter, configType } from "./modules";
import { AttachmentBuilder, Client, EmbedBuilder, EmbedData, GatewayIntentBits, Message, Partials, WebhookClient } from "discord.js";
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
				console.log(args);
				let deth_messages_regex = [
					/^(.*?)\swas\spricked\sto\sdeath$/,
					/^(.*?)\swalked\sinto\sa\scactus\swhile\strying\sto\sescape\s(.*?)$/,
					/^(.*?)\sdrowned$/,
					/^(.*?)\sdrowned\swhile\strying\sto\sescape\s(.*?)$/,
					/^(.*?)\sdied\sfrom\sdehydration$/,
					/^(.*?)\sdied\sfrom\sdehydration\swhile\strying\sto\sescape\s(.*?)$/,
					/^(.*?)\sexperienced\skinetic\senergy$/,
					/^(.*?)\s\sexperienced\skinetic\senergy\swhile\strying\sto\sescape\s(.*?)$/,
					/^(.*?)\sblew\sup$/,
					/^(.*?)\swas\sblown\sup\sby\s(.*?)$/,
					/^(.*?)\swas\sblown\sup\sby\s(.*?)\susing\s(.*?)$/,
					/^(.*?)\swas\skilled\sby\s[Intentional\sGame\sDesign]$/,
					/^(.*?)\shit\sthe\sground\stoo\shard$/,
					/^(.*?)\shit\sthe\sground\stoo\shard\swhile\strying\sto\sescape\s(.*?)$/,
					/^(.*?)\sfell\sfrom\sa\shigh\splace$/,
					/^(.*?)\sfell\soff\sa\sladder$/,
					/^(.*?)\sfell\soff\ssome\svines$/,
					/^(.*?)\sfell\soff\ssome\sweeping\svines$/,
					/^(.*?)\sfell\soff\ssome\stwisting\svines$/,
					/^(.*?)\sfell\soff\sscaffolding$/,
					/^(.*?)\sfell\swhile\sclimbing$/,
					/^(.*?)\swas\sdoomed\sto\sfall$/,
					/^(.*?)\swas\sdoomed\sto\sfall\sby\s(.*?)$/,
					/^(.*?)\swas\sdoomed\sto\sfall\sby\s(.*?)\susing\s(.*?)$/,
					/^(.*?)\swas\simpaled\son\sa\sstalagmite$/,
					/^(.*?)\swas\simpaled\son\sa\sstalagmite\swhile\sfighting\s(.*?)$/,
					/^(.*?)\swas\ssquashed\sby\sa\sfalling\sanvil$/,
					/^(.*?)\swas\ssquashed\sby\sa\sfalling\sblock$/,
					/^(.*?)\swas\sskewered\sby\sa\sfalling\sstalactite$/,
					/^(.*?)\swent\sup\sin\sflames$/,
					/^(.*?)\swalked\sinto\sfire\swhile\sfighting\s(.*?)$/,
					/^(.*?)\sburned\sto\sdeath$/,
					/^(.*?)\swas\sburned\sto\sa\scrisp\swhile\sfighting\s(.*?)$/,
					/^(.*?)\swent\soff\swith\sa\sbang$/,
					/^(.*?)\swent\soff\swith\sa\sbang\sdue\sto\sa\sfirework\sfired\sfrom\s(.*?)\susing\s(.*?)$/,
					/^(.*?)\stried\sto\sswim\sin\slava$/,
					/^(.*?)\stried\sto\sswim\sin\slava\sto\sescape\s(.*?)$/,
					/^(.*?)\swas\sstruck\sby\slightning$/,
					/^(.*?)\swas\sstruck\sby\slightning\swhile\sfighting\s(.*?)$/,
					/^(.*?)\sdiscovered\sthe\sfloor\swas\slava$/,
					/^(.*?)\swalked\sinto\sthe\sdanger\szone\sdue\sto\s(.*?)$/,
					/^(.*?)\swas\skilled\sby\smagic$/,
					/^(.*?)\swas\skilled\sby\smagic\swhile\strying\sto\sescape\s(.*?)$/,
					/^(.*?)\swas\skilled\sby\s(.*?)\susing\smagic$/,
					/^(.*?)\swas\skilled\sby\s(.*?)\susing\s(.*?)(?!magic)$/,
					/^(.*?)\sfroze\sto\sdeath$/,
					/^(.*?)\swas\sfrozen\sto\sdeath\sby\s(.*?)$/,
					/^(.*?)\swas\sslain\sby\s(.*?)$/,
					/^(.*?)\swas\sslain\sby\s(.*?)\susing\s(.*?)$/,
					/^(.*?)\swas\sstung\sto\sdeath$/,
					/^(.*?)\swas\sstung\sto\sdeath\sby\s(.*?)\susing\s(.*?)$/,
					/^(.*?)\swas\sobliterated\sby\sa\ssonically-charged\sshriek$/,
					/^(.*?)\swas\sobliterated\sby\sa\ssonically-charged\sshriek\swhile\strying\sto\sescape\s(.*?)\swielding\s(.*?)$/,
					/^(.*?)\swas\sshot\sby\s(.*?)$/,
					/^(.*?)\swas\sshot\sby\s(.*?)\susing\s(.*?)$/,
					/^(.*?)\swas\spummeled\sby\s(.*?)$/,
					/^(.*?)\swas\spummeled\sby\s(.*?)\susing\s(.*?)$/,
					/^(.*?)\swas\sfireballed\sby\s(.*?)$/,
					/^(.*?)\swas\sfireballed\sby\s(.*?)\susing\s(.*?)$/,
					/^(.*?)\swas\sshot\sby\sa\sskull\sfrom\s(.*?)$/,
					/^(.*?)\swas\sshot\sby\sa\sskull\sfrom\s(.*?)\susing\s(.*?)$/,
					/^(.*?)\sstarved\sto\sdeath$/,
					/^(.*?)\sstarved\sto\sdeath\swhile\sfighting\s(.*?)$/,
					/^(.*?)\ssuffocated\sin\sa\swall$/,
					/^(.*?)\ssuffocated\sin\sa\swall\swhile\sfighting\s(.*?)$/,
					/^(.*?)\swas\ssquished\stoo\smuch$/,
					/^(.*?)\swas\ssquashed\sby\s(.*?)$/,
					/^(.*?)\sleft\sthe\sconfines\sof\sthis\sworld$/,
					/^(.*?)\sleft\sthe\sconfines\sof\sthis\sworld\swhile\sfighting\s(.*?)$/,
					/^(.*?)\swas\spoked\sto\sdeath\sby\sa\ssweet\sberry\sbush$/,
					/^(.*?)\swas\spoked\sto\sdeath\sby\sa\ssweet\sberry\sbush\swhile\strying\sto\sescape\s(.*?)$/,
					/^(.*?)\swas\skilled\swhile\strying\sto\shurt\s(.*?)$/,
					/^(.*?)\swas\simpaled\sby\s(.*?)$/,
					/^(.*?)\swas\simpaled\sby\s(.*?)\swith\s(.*?)$/,
					/^(.*?)\sfell\sout\sof\sthe\sworld$/,
					/^(.*?)\sdidn't\swant\sto\slive\sin\sthe\ssame\sworld\sas\s(.*?)$/,
					/^(.*?)\swithered\saway$/,
					/^(.*?)\sdied\sbecause\sof\s(.*?)$/,
					/^(.*?)\swas\skilled$/,
					/^(.*?)\sdidn't\swant\sto\slive\sas\s(.*?)$/,
					/^(.*?)\swas\skilled\sby\seven\smore\smagic$/,
				];
				for (let deth_message_regex of deth_messages_regex) {
					const death_message_match = args.match(deth_message_regex);
					if (death_message_match !== null && !death_message_match.includes("")) {
						const playerName = death_message_match[1];
						const attackMob = death_message_match[2];
						const item = death_message_match[3];
						//death event
						if (attackMob === undefined) {
							this.event.emit("death", args, playerName);
						} else if (item === undefined) {
							this.event.emit("death", args, playerName, attackMob);
						} else {
							this.event.emit("death", args, playerName, attackMob, item);
						}
					}
				}
				let deth_message_regex2 = /^(.*?)\swas\skilled\sby\s(.*?)\swhile\strying\sto\shurt\s(.*?)$/; //player , item , attack
				let death_message_match = args.match(deth_message_regex2);
				if (death_message_match !== null && !death_message_match.includes("")) {
					const playerName = death_message_match[1];
					const item = death_message_match[2];
					const attackMob = death_message_match[3];
					//death event
					if (attackMob === undefined) {
						this.event.emit("death", args, playerName);
					} else if (item === undefined) {
						this.event.emit("death", args, playerName, attackMob);
					} else {
						this.event.emit("death", args, playerName, attackMob, item);
					}
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
		this.event.sendEmbed = this.sendMessageEmbed.bind(this);
	}
	private async messageCreate(message: Message) {
		if (message.channelId !== this.channel_id) return;
		if (message.author.bot) return;
		this.event.emit("chat", message);
	}
	private async sendMessage(playerName: string, message: string, avatar_url?: string) {
		const webhookClient = new WebhookClient({ url: this.channel_webhook });
		webhookClient.send({
			username: playerName,
			content: message,
			avatarURL: avatar_url,
		});
	}
	private async sendMessageEmbed(playerName: string, body: EmbedData, avatar_url?: string) {
		const webhookClient = new WebhookClient({ url: this.channel_webhook });
		webhookClient.send({
			username: playerName,
			embeds: [new EmbedBuilder(body)],
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
