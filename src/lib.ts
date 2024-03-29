import {NewChatData, NewUserData} from "./types";
import {Context, Markup} from "telegraf";
import {ChatMemberMember, User} from "typegram";
import {promises as fs} from "fs";
import {parse, stringify} from "flatted";

export const findUser = (userId: number, newChatData: NewChatData | null): NewUserData | null =>
    newChatData?.newUsers.find(user => userId === user.id) || null;

export const findChat = (chatId: number, newChatsData: NewChatData[] | null): NewChatData | null =>
    newChatsData?.find(chat => chatId === chat.chatId) || null;

export function addUser(userData: NewUserData, chatData: NewChatData | null, timeout: NodeJS.Timeout): void | null {
    if (!chatData) return null;
    const user = {
        ...userData,
        identifier: getIdentifier(userData.id),
        timeout
    }
    chatData.newUsers.push(user);
}

export function updateChatsData(chatsData: NewChatData[] | null, chatData: NewChatData | null) {
    if (!chatsData || !chatData) return null
    chatsData = chatsData.map((chat) =>
        chat.chatId === chatData.chatId ? chatData : chat
    );

}

export async function sendWelcome(ctx: Context, user: User) {
    try {
        return await ctx.replyWithMarkdownV2(`Welcome to the chat, [\\${user.first_name}](tg://user?id=${user.id}) \\! It is an anti\\-bot system\\. Please, verify yourself by pressing the button during *1 minute*, otherwise you will be *kicked*\\.`,
            Markup.inlineKeyboard([
                Markup.button.callback('Verify', "verification")
            ]));
    }
    catch(e){
        return await ctx.replyWithMarkdownV2(`Welcome to the chat, [Absolute Student](tg://user?id=${user.id}) \\! It is an anti\\-bot system\\. Please, verify yourself by pressing the button during *1 minute*, otherwise you will be *kicked*\\.`,
            Markup.inlineKeyboard([
                Markup.button.callback('Verify', "verification")
            ]));
    }
}

export function addChat(chatsData: NewChatData[] | null, chatId: number, latestMessageId: number): void {
    chatsData?.push({chatId, newUsers: [], latestMessageId});
}

export function getIdentifier(userId: number): string {
    return Buffer.from(`${userId}`).toString('base64');
}

export async function processBan(user: User, chatData: NewChatData, ctx: Context): Promise<void> {
    const userStatus = await getUserStatus(ctx, user.id);
    chatData.newUsers = chatData.newUsers.filter((user) => user.id !== user.id);
    if (userStatus === "member") await ctx.banChatMember(user.id);
    try {
        await ctx.replyWithMarkdownV2(`[\\${user.first_name}](tg://user?id=${user.id}) hasn't been verified\\!`);
    }
    catch (e) {
        await ctx.replyWithMarkdownV2(`[Absolute Student](tg://user?id=${user.id}) hasn't been verified\\!`);
    }
}

export async function verify(ctx: Context, userData: NewUserData) {
    try {
        await ctx.replyWithMarkdownV2(`[\\${userData.first_name}](tg://user?id=${userData.id}) has been verified\\!`);
    }
    catch (e) {
        await ctx.replyWithMarkdownV2(`[Absolute Student](tg://user?id=${userData.id}) has been verified\\!`);
    }
    clearTimeout(userData.timeout);
}

export async function writeFile(chatsData: NewChatData[] | null) {
    await fs.writeFile("database/chats.json", stringify(chatsData), 'utf8');
}

export async function readFile(): Promise<NewChatData[] | null> {
    return parse(await fs.readFile("database/chats.json", "utf8"));
}

export async function initializeData(chatsData: NewChatData[], readFunc: () => Promise<NewChatData[]>) {
    chatsData = await readFunc();
}

export async function initializeNewChat(ctx: Context, newChatsData: NewChatData[] | null) {
    addChat(newChatsData, ctx.chat!.id, 0);
    await writeFile(newChatsData);
    return findChat(ctx.chat!.id, newChatsData);
}

export async function getUserStatus(ctx: Context, userId: number) {
    const userInfo = await ctx.getChatMember(userId);
    return userInfo.status;
}
