import { LogCreate } from "../type/log-create.interface";


export const createLogger = (logger : LogCreate) => {
    const { message, level, path, timestamp = new Date() } = logger;


    return {
        message,
        level,
        path,
        timestamp: timestamp.toISOString(),
    }
}