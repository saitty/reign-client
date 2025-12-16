export interface User {
    id: string;
    username: string;
    createdAt: string;
    role?: 'USER' | 'ADMIN';
    userType?: 'GUEST' | 'REGISTERED';
}

export interface TeamMember {
    id: string;
    user: User;
    joinedAt: string;
    createdAt: string;
}

export interface Team {
    id: string;
    name: string;
    color: "red" | "blue" | "green" | "yellow" | "purple" | "teal";
    creator: User;
    members: TeamMember[];
    createdAt: string;
}

export interface World {
    id: string;
    slug: string;
    name: string;
    owner: User;
    teams: Team[];
    boardSize: number;
    maxPlayers: number;
    maxTeams: number;
    minTeams: number;
    maxTeamSize: number;
    minTeamSize: number;
    allowPlayerTeamCreation: boolean;
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