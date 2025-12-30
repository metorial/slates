import z from 'zod';

/**
 * Send Log
 */
export let slatesMessageLogSendNotification = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.literal('slates/log.send'),
  params: z.object({
    type: z.union([
      z.literal('info'),
      z.literal('warning'),
      z.literal('error'),
      z.literal('progress')
    ]),
    timestamp: z.string(),
    message: z.string()
  })
});

export type SlatesMessageLogSendNotification = z.infer<
  typeof slatesMessageLogSendNotification
>;

export type SlatesLogNotifications = SlatesMessageLogSendNotification;

export let slatesLogNotificationsByMethod = {
  'slates/log.send': slatesMessageLogSendNotification
};
