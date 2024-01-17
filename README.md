# rlog-mc

Connects Minecraft Server and Discord without any mods or plugins.

## Usage

Add the following three lines to `server.properties`.

```text
enable-rcon=true
rcon.port=
rcon.password=
```

Set up the `src/.env` file.

```env
latest_log_path = 

discord_bot_token = 
discord_chat_channel_id = 
discord_chat_channel_webhook = 

rcon_host = 
rcon_port = 
rcon_password = 
```

## Class

### `Minecraft class`

- `Main.minecraft` : EventEmitter
  - events: join, leave, command, chat, death
- `Main.minecraft.getMcIcon`: Returns the URL of the player's Minecraft icon.

### `Rcon class`

- `Main.rcon.send()`: Send and execute commands to the server.

### `Discorrd class`

- `Main.discord`: Discord.Client
- `Miin.discord.send()`: Send a message to the Discord webhook.
- `Miin.discord.sendEmbed()`: Send message embed to Discord webhook.

All display formats are contained in `src/plugins/index.ts`.
