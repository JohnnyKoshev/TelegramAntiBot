# Telegram Bot. Anti-Bot System

This is a Telegram bot project that implements an anti-bot system for group chats. The bot detects new users joining the chat, sends them a verification message, and kicks them if they fail to verify themselves within a specified time limit.

## Features

- Detects new users joining the chat.
- Sends a welcome message with a verification button to new users.
- Kicks users who fail to verify themselves within the time limit.
- Maintains a database of chat and user information.
- Graceful stop handling for the bot.

## Prerequisites

- Node.js (version 14 or above)
- Telegram Bot API Token

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/JohnnyKoshev/TelegramAntiBot.git
   ```

2. Navigate to the project directory:

   ```bash
   cd TelegramAntiBot
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root directory and add the following line:

   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   ```

   Replace `your_bot_token` with your Telegram Bot API token.
 
4. Build:

```bash
npm run build
```

5. Start the bot:

   ```bash
   npm start
   ```

## Usage

1. Add the bot to your Telegram group chat.

2. New users joining the chat will receive a welcome message with a verification button.

3. The new users must click the "Verify" button within 1 minute to verify themselves.

4. If a user fails to verify within the time limit, they will be kicked from the chat.

## Customization

You can modify the behavior of the bot by editing the source files and adjusting the code as needed. Some possible customizations include:

- Modifying the welcome message content in `lib.ts`.
- Changing the verification time limit in milliseconds in `AntiBot.ts`.
- Adding additional actions to be performed when a user is kicked or verified.

## Contributing

Contributions to the project are welcome. If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
