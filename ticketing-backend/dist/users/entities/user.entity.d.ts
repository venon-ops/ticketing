export declare enum UserRole {
    USER = "user",
    ORGANIZER = "organizer",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
