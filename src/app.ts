require('dotenv').config();

import {Context, Telegraf} from 'telegraf';
import {Update} from 'typegram';
import {message} from "telegraf/filters";
import {NewChatData, NewUserData} from "./types";
import {
    addChat,
    addUser,
    displayWelcome,
    findChat,
    findUser,
    getIdentifier,
    processBan, readFile,
    updateChatsData,
    verify, writeFile
} from "./lib";
import {token} from "./env";
import * as fs from "fs";

class AntiBot {
    botToken: string = process.env.TELEGRAM_BOT_TOKEN!;
    bot: Telegraf<Context<Update>> = new Telegraf(this.botToken);
    newChatsData: NewChatData[] | null = [];

    constructor() {
        if (fs.existsSync('database/chats.json'))
            readFile().then((val) => {
                this.newChatsData = val;
            })
        else
            writeFile(this.newChatsData).then(() => {
            });
        this.handleUserJoin();
        this.handleVerification();
        this.enableGracefulStop()
    }

    private async showAlert(ctx: Context): Promise<void> {
        await ctx.answerCbQuery("You are not allowed to press this button!", {show_alert: true, cache_time: 1800});
    }

    private deleteUser(chatData: NewChatData, userData: NewUserData) {
        chatData.newUsers = chatData.newUsers.filter((user) => user !== userData);
    }


    async updateLatestMsgId(chatData: NewChatData | null, ctx: Context) {
        if (ctx.message) {
            chatData!.latestMessageId = ctx.message.message_id;
            updateChatsData(this.newChatsData, chatData);
            await writeFile(this.newChatsData);
        }
    }

    async initializeNewChat(chatData: NewChatData | null, ctx: Context) {
        addChat(this.newChatsData, ctx.chat!.id, 0);
        await writeFile(this.newChatsData);
        return findChat(ctx.chat!.id, this.newChatsData);
    }

    handleUserJoin() {
        this.bot.on(message('new_chat_members'),
            async (ctx) => {
                let newChatData = findChat(ctx.chat.id, this.newChatsData);
                if (!newChatData)
                    newChatData = await this.initializeNewChat(newChatData, ctx);
                if (ctx.message.message_id > newChatData!.latestMessageId) {
                    for (const newUser of ctx.update.message.new_chat_members) {
                        await displayWelcome(ctx, newUser);
                        let timeout = setTimeout(async () => {
                            await processBan(newUser, newChatData!, ctx);
                            updateChatsData(this.newChatsData, newChatData);
                            await writeFile(this.newChatsData);
                        }, 60000);
                        addUser({
                            id: newUser.id,
                            name: newUser.first_name!,
                            timeout,
                            identifier: getIdentifier(newUser.id)
                        }, newChatData);
                        updateChatsData(this.newChatsData, newChatData);
                        await writeFile(this.newChatsData);
                    }
                    await this.updateLatestMsgId(newChatData, ctx);
                }
            });
    }

    handleVerification() {
        this.bot.action("verification", async (ctx) => {
            const newChatData = findChat(ctx.chat!.id, this.newChatsData);
            const newUserData = findUser(ctx.from!.id, newChatData);
            if (
                newUserData && newUserData.identifier ===
                getIdentifier(ctx.from!.id)
            ) {
                await verify(ctx, newUserData);
                this.deleteUser(newChatData!, newUserData);
                updateChatsData(this.newChatsData, newChatData!);
                await writeFile(this.newChatsData);
            } else {
                await this.showAlert(ctx);
            }
        });
    }

    async startBot() {
        await this.bot.launch();
    }

    enableGracefulStop() {
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }

}

const antiBot: AntiBot = new AntiBot();
antiBot.startBot();
// bot.command('check', async (ctx) => {
//     await ctx.reply("I am in the working state!");
// })
