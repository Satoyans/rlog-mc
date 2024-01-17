import { Message } from "discord.js";
import { rlog } from "../index";

async function convertTellraw(message: Message): Promise<string | undefined> {
	let rawtext: string[] = [];
	const match_result = message.content.match(/<@(\d{18}?)>/g);
	const split_result = message.content.split(/<@\d{18}>/);
	rawtext.push(`{"text":"${message.member?.nickname ?? message.author.displayName} > "}`);
	if (message.reference) {
		const reply_message = await message.fetchReference();
		const reply_author = reply_message.member?.nickname ?? reply_message.author.displayName;
		const reply_content = reply_message.cleanContent;
		rawtext.push(`{"text":"[reply]","color":"green","hoverEvent":{"action":"show_text","value":"${reply_author} > ${reply_content}"}}`);
	}
	for (let i in match_result ?? []) {
		rawtext.push(`{"text":"${split_result[Number(i)]}"}`);
		let id = match_result![Number(i)].replace("<@", "").replace(">", "");
		rawtext.push(
			`{"text":"@${message.client.users.cache.get(id)?.globalName}","color":"blue","hoverEvent":{"action":"show_text","value":"@${id}"}}`
		);
	}
	rawtext.push(`{"text":"${split_result[Number(split_result.length - 1)]}"}`);
	return `/tellraw @a [${rawtext.join(",")}]`;
}
rlog.discord.on("chat", async (message) => {
	const cmd = await convertTellraw(message);
	if (!cmd) return;
	const result = await rlog.rcon.send(cmd);
});

rlog.minecraft.on("chat", async (time, info, playerName, message) => {
	rlog.discord.send(playerName, message, await rlog.minecraft.getIcon(playerName));
});
rlog.minecraft.on("join", async (time, info, playerName) => {
	rlog.discord.sendEmbed(playerName, { title: `${playerName} join the game`, color: 0x06d69e }, await rlog.minecraft.getIcon(playerName));
});
rlog.minecraft.on("leave", async (time, info, playerName) => {
	rlog.discord.sendEmbed(playerName, { title: `${playerName} left the game`, color: 0xef476e }, await rlog.minecraft.getIcon(playerName));
});
rlog.minecraft.on("death", async (log, playerName, attackMob, item) => {
	rlog.discord.sendEmbed(playerName, { title: `${playerName} died`, description: log, color: 0xffd166 }, await rlog.minecraft.getIcon(playerName));
});
