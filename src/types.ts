export interface NewUserData {
    id: number
    name: string
    timeout: NodeJS.Timeout
    identifier: string
}

export interface NewChatData {
    chatId: number
    newUsers: NewUserData[]
    latestMessageId: number
}