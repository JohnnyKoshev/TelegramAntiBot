export interface NewUserData {
    id: number
    first_name: string
    timeout?: NodeJS.Timeout
    identifier?: string
}

export interface NewChatData {
    chatId: number
    newUsers: NewUserData[]
    latestMessageId: number
}