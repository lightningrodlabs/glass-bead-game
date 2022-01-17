import { IUser } from "./Interfaces";
const USERS = 'USERS';
export const ACCOUNT_DATA = 'ACCOUNT_DATA';

interface UserWithCredential {
    username: string;
    password: string;
    profile: IUser;
}

const defaultUser: UserWithCredential = {
    username: 'jamesbond',
    password: 'letmein',
    profile: {
        id: 1,
        handle: 'jamesbond',
        name: 'James Bond',
        createdAt: (new Date()).toString()
    }
}

export function getStorageItem<Type>(key: string): Type | null {
    const value = localStorage.getItem(key)
    if (!value) {
        return null
    }

    try {
        const parsed = JSON.parse(value)

        return parsed as Type
    } catch (e) {
        return null
    }
}

export function setStorageItem(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value))
}


export const login = async (username: string, password: string) => {
    const allUsers = getStorageItem<UserWithCredential[]>(USERS) || []
    
    const user = allUsers.find(user => user.username === username);
    if (!user) {
        throw new Error('User not found')
    }
    if (user.password !== password) {
        throw new Error('Incorrect password')
    }

    return user;
}

export const signup = async (username: string, name: string, password: string) => {
    const newUser = {
        username, password, profile: {
            id: Date.now(),
            handle: username,
            name,
            createdAt: (new Date()).toString()
        }
    }
    const allUsers = getStorageItem<UserWithCredential[]>(USERS) || []
    if (allUsers.find(user => user.username === username)) {
        throw new Error('Username already taken')
    }

    setStorageItem(USERS, allUsers.concat([newUser]))
}

// export const signup = (username, password, profile)

if (!getStorageItem(USERS)) {
    setStorageItem(USERS, [defaultUser])
}