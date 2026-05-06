export interface AuthPayload {
    userId: string;
    tenantId: string;
    role: string;
}
export declare const generateTokens: (payload: AuthPayload) => {
    accessToken: string;
    refreshToken: string;
};
export declare const verifyToken: (token: string) => AuthPayload;
export declare const authenticateToken: (req: any, res: any, next: any) => any;
export declare const authenticateSocket: (socket: any, next: any) => any;
export declare const requireRole: (...roles: string[]) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=auth.d.ts.map