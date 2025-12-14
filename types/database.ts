export interface User {
    id: string;
    username: string;
    createdAt: string;
    role?: 'USER' | 'ADMIN';
    userType?: 'GUEST' | 'REGISTERED';
}

export interface World {
    id: string;
    slug: string;
    name: string;
    owner: User;
    boardSize: number;
    maxPlayers: number;
    createdAt: string;
}

export interface Square {
    id: string;
    worldSlug: string;
    x: number;
    y: number;
    owner: User | null;
    defenseBonus: number;
}

export interface AuthResponse {
    token: string;
    username: string;
    userId: string;
    role: 'USER' | 'ADMIN';
    userType: 'GUEST' | 'REGISTERED';
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
}