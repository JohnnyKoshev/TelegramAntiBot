require('dotenv').config();

import {Context, Telegraf} from 'telegraf';
import {Update, User} from 'typegram';
import {message} from "telegraf/filters";
import {NewChatData, NewUserData} from "./types";
import {
    addChat,
    addUser,
    sendWelcome,
    findChat,
    findUser,
    getIdentifier,
    processBan,
    readFile,
    updateChatsData,
    verify,
    writeFile, getUserStatus
} from "./lib";
import * as fs from "fs";

function initializeTelegramBot(): Telegraf<Context> {
    return new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
}

class AntiBot {
    private newChatsData: NewChatData[] | null = [];

    constructor(private bot: Telegraf<Context<Update>>) {
    }

    async run() {
        if (fs.existsSync('database/chats.json'))
            readFile().then((val) => {
                this.newChatsData = val;
            })
        else
            writeFile(this.newChatsData).then();
        this.handleUserJoin();
        this.handleVerification();
        this.enableGracefulStop()
        await this.bot.launch();
    }

    private async showAlert(ctx: Context): Promise<void> {
        await ctx.answerCbQuery(
            "You are not allowed to press this button!",
            {show_alert: true, cache_time: 1800}
        );
    }

    private deleteUser(chatData: NewChatData | null, userData: NewUserData) {
        if (!chatData) return;
        chatData.newUsers = chatData.newUsers.filter((user) => user !== userData);
    }


    private async updateLatestMsgId(chatData: NewChatData | null, ctx: Context) {
        if (!ctx.message) return;
        chatData!.latestMessageId = ctx.message.message_id;
        updateChatsData(this.newChatsData, chatData);
        await writeFile(this.newChatsData);
        return;
    }

    private async initializeNewChat(ctx: Context) {
        addChat(this.newChatsData, ctx.chat!.id, 0);
        await writeFile(this.newChatsData);
        return findChat(ctx.chat!.id, this.newChatsData);
    }

    private handleUserJoin() {
        this.bot.on(message('new_chat_members'),
            async (ctx) => {
                const botStatus = await getUserStatus(ctx, ctx.botInfo.id);
                console.log(ctx.chat.id);
                if (ctx.chat.id === -1001751824071
                    && botStatus === "administrator") {
                    let newChatData = findChat(ctx.chat.id, this.newChatsData);
                    if (!newChatData) newChatData = await this.initializeNewChat(ctx);
                    if (ctx.message.message_id > newChatData!.latestMessageId) {
                        for (const newUser of ctx.update.message.new_chat_members) {
                            await this.sendNotification(ctx, newUser, newChatData);
                        }
                        await this.updateLatestMsgId(newChatData, ctx);
                    }
                }
            });
    }

    private async sendNotification(ctx: Context, newUser: User, newChatData: NewChatData | null) {
        const userStatus = await getUserStatus(ctx, newUser.id);
        if (!newUser.is_bot && userStatus !== "administrator" && userStatus === "member") {
            const welcomeMsg = await sendWelcome(ctx, newUser);
            const timeout = setTimeout(async () => {
                await processBan(newUser, newChatData!, ctx);
                updateChatsData(this.newChatsData, newChatData);
                await writeFile(this.newChatsData);
                if (!!welcomeMsg) await ctx.deleteMessage(welcomeMsg.message_id);
            }, 60000);
            addUser(newUser, newChatData, timeout);
            updateChatsData(this.newChatsData, newChatData);
            await writeFile(this.newChatsData);
        }
    }

    private handleVerification() {
        this.bot.action("verification", async (ctx) => {
            const welcomeMsg = ctx.update.callback_query.message;
            const newChatData = findChat(ctx.chat!.id, this.newChatsData);
            const newUserData = findUser(ctx.from!.id, newChatData);
            if (
                newUserData && newUserData.identifier ===
                getIdentifier(ctx.from!.id)
            ) {
                await verify(ctx, newUserData);
                this.deleteUser(newChatData, newUserData);
                updateChatsData(this.newChatsData, newChatData!);
                await writeFile(this.newChatsData);
                if (!!welcomeMsg) await ctx.deleteMessage(welcomeMsg.message_id);
                return;
            }
            await this.showAlert(ctx);
            return;
        });
    }

    private enableGracefulStop() {
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }

}

async function main() {
    const bot = initializeTelegramBot();
    const antiBot: AntiBot = new AntiBot(bot);
    await antiBot.run();
}

main().then();

