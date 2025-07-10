export interface LogCreate {
    message: string;
    level: 'info' | 'warn' | 'error';
    path: string;
    timestamp?: Date;
}