import { Message } from "discord.js";
import { rlog } from "../index";

function convertTellraw(message: Message): string | undefined {
	let rawtext: string[] = [];
	const match_result = message.content.match(/<@(\d{18}?)>/g);
	const split_result = message.content.split(/<@\d{18}>/);
	console.log(match_result);
	console.log(split_result);
	rawtext.push(`{"text":"${message.member?.nickname ?? message.author.displayName} > "}`);
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
rlog.discord.on("chat", (message) => {
	console.log(convertTellraw(message));
});
