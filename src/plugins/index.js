"use strict";
exports.__esModule = true;
var index_1 = require("../index");
function convertTellraw(message) {
    var _a, _b, _c;
    var rawtext = [];
    var match_result = message.content.match(/<@(\d{18}?)>/g);
    var split_result = message.content.split(/<@\d{18}>/);
    console.log(match_result);
    console.log(split_result);
    rawtext.push("{\"text\":\"".concat((_b = (_a = message.member) === null || _a === void 0 ? void 0 : _a.nickname) !== null && _b !== void 0 ? _b : message.author.displayName, " > \"}"));
    for (var i in match_result !== null && match_result !== void 0 ? match_result : []) {
        rawtext.push("{\"text\":\"".concat(split_result[Number(i)], "\"}"));
        var id = match_result[Number(i)].replace("<@", "").replace(">", "");
        rawtext.push("{\"text\":\"@".concat((_c = message.client.users.cache.get(id)) === null || _c === void 0 ? void 0 : _c.globalName, "\",\"color\":\"blue\",\"hoverEvent\":{\"action\":\"show_text\",\"value\":\"@").concat(id, "\"}}"));
    }
    rawtext.push("{\"text\":\"".concat(split_result[Number(split_result.length - 1)], "\"}"));
    return "/tellraw @a [".concat(rawtext.join(","), "]");
}
index_1.rlog.discord.on("chat", function (message) {
    console.log(convertTellraw(message));
});
