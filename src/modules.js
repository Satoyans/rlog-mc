"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.LogWatch = exports.DiscordEventEmitter = exports.MinecraftEventEmitter = void 0;
var events_1 = require("events");
var path = require("path");
var fs = require("fs");
var MinecraftEventEmitter = /** @class */ (function (_super) {
    __extends(MinecraftEventEmitter, _super);
    function MinecraftEventEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MinecraftEventEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return _super.prototype.emit.apply(this, __spreadArray([event], args, false));
    };
    MinecraftEventEmitter.prototype.on = function (eventName, func) {
        return _super.prototype.on.call(this, eventName, func);
    };
    return MinecraftEventEmitter;
}(events_1.EventEmitter));
exports.MinecraftEventEmitter = MinecraftEventEmitter;
var DiscordEventEmitter = /** @class */ (function (_super) {
    __extends(DiscordEventEmitter, _super);
    function DiscordEventEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DiscordEventEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return _super.prototype.emit.apply(this, __spreadArray([event], args, false));
    };
    DiscordEventEmitter.prototype.on = function (eventName, func) {
        return _super.prototype.on.call(this, eventName, func);
    };
    return DiscordEventEmitter;
}(events_1.EventEmitter));
exports.DiscordEventEmitter = DiscordEventEmitter;
var LogWatch = /** @class */ (function () {
    function LogWatch(config) {
        this.latest_log_path = path.join(config.latest_log_path);
        this.check_interval_ms = 1000; //チェック間隔(ms)
        this.event = new events_1.EventEmitter();
        this.chengeEventAfter();
        this.checkLogfile();
        console.log("watch log file path:" + this.latest_log_path);
        this.event.on("change", this.chengeEventAfter.bind(this));
        this.last_size = 0;
        this.last_text = Array(100).fill('"').join("'"); //なさそうな文字列
    }
    LogWatch.prototype.checkLogfile = function () {
        var _this = this;
        var check = function () {
            var size = fs.statSync(_this.latest_log_path).size;
            if (_this.last_size < size && _this.last_size !== 0) {
                _this.event.emit("change");
            }
            _this.last_size = size;
        };
        setInterval(check, this.check_interval_ms);
    };
    LogWatch.prototype.chengeEventAfter = function () {
        var _this = this;
        var stream = fs.createReadStream(this.latest_log_path);
        var chunks = [];
        stream
            .on("data", function (chunk) {
            chunks.push(chunk);
        })
            .on("end", function () {
            var buffer = Buffer.concat(chunks, chunks.reduce(function (sum, chunk) { return (sum += chunk.length); }, 0));
            var text = buffer.toString("utf-8");
            var split_text1 = text.split(_this.last_text);
            var split_text2 = split_text1[split_text1.length - 1].split("\r\n");
            split_text2.pop();
            _this.last_text = text;
            if (_this.last_size === 0)
                return;
            _this.event.emit("change_diff", split_text2);
        });
    };
    return LogWatch;
}());
exports.LogWatch = LogWatch;
