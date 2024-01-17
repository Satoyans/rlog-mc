"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var index_1 = require("../index");
function convertTellraw(message) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function () {
        var rawtext, match_result, split_result, reply_message, reply_author, reply_content, i, id;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    rawtext = [];
                    match_result = message.content.match(/<@(\d{18}?)>/g);
                    split_result = message.content.split(/<@\d{18}>/);
                    rawtext.push("{\"text\":\"".concat((_b = (_a = message.member) === null || _a === void 0 ? void 0 : _a.nickname) !== null && _b !== void 0 ? _b : message.author.displayName, " > \"}"));
                    if (!message.reference) return [3 /*break*/, 2];
                    return [4 /*yield*/, message.fetchReference()];
                case 1:
                    reply_message = _f.sent();
                    reply_author = (_d = (_c = reply_message.member) === null || _c === void 0 ? void 0 : _c.nickname) !== null && _d !== void 0 ? _d : reply_message.author.displayName;
                    reply_content = reply_message.cleanContent;
                    rawtext.push("{\"text\":\"[reply]\",\"color\":\"green\",\"hoverEvent\":{\"action\":\"show_text\",\"value\":\"".concat(reply_author, " > ").concat(reply_content, "\"}}"));
                    _f.label = 2;
                case 2:
                    for (i in match_result !== null && match_result !== void 0 ? match_result : []) {
                        rawtext.push("{\"text\":\"".concat(split_result[Number(i)], "\"}"));
                        id = match_result[Number(i)].replace("<@", "").replace(">", "");
                        rawtext.push("{\"text\":\"@".concat((_e = message.client.users.cache.get(id)) === null || _e === void 0 ? void 0 : _e.globalName, "\",\"color\":\"blue\",\"hoverEvent\":{\"action\":\"show_text\",\"value\":\"@").concat(id, "\"}}"));
                    }
                    rawtext.push("{\"text\":\"".concat(split_result[Number(split_result.length - 1)], "\"}"));
                    return [2 /*return*/, "/tellraw @a [".concat(rawtext.join(","), "]")];
            }
        });
    });
}
index_1.rlog.discord.on("chat", function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var cmd, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, convertTellraw(message)];
            case 1:
                cmd = _a.sent();
                if (!cmd)
                    return [2 /*return*/];
                return [4 /*yield*/, index_1.rlog.rcon.send(cmd)];
            case 2:
                result = _a.sent();
                return [2 /*return*/];
        }
    });
}); });
index_1.rlog.minecraft.on("chat", function (time, info, playerName, message) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _b = (_a = index_1.rlog.discord).send;
                _c = [playerName, message];
                return [4 /*yield*/, index_1.rlog.minecraft.getIcon(playerName)];
            case 1:
                _b.apply(_a, _c.concat([_d.sent()]));
                return [2 /*return*/];
        }
    });
}); });
