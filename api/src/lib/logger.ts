import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

const options: pino.LoggerOptions = {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    serializers: { err: pino.stdSerializers.err },
    timestamp: pino.stdTimeFunctions.isoTime,
};

export const logger = isDev
    ? pino({
          ...options,
          transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' },
          },
      })
    : pino(options);

export type Logger = typeof logger;
