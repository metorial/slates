export * from './action';
export * from './auth';
export * from './config';
export * from './controlFlow';
export * from './identify';

import { z } from 'zod';
import {
  SlatesActionRequests,
  slatesActionRequestsByMethod,
  SlatesActionResponses,
  slatesActionResponsesByMethod
} from './action';
import {
  SlatesAuthNotifications,
  slatesAuthNotificationsByMethod,
  SlatesAuthRequests,
  slatesAuthRequestsByMethod,
  SlatesAuthResponses,
  slatesAuthResponsesByMethod
} from './auth';
import {
  SlatesConfigNotifications,
  slatesConfigNotificationsByMethod,
  SlatesConfigRequests,
  slatesConfigRequestsByMethod,
  SlatesConfigResponses,
  slatesConfigResponsesByMethod
} from './config';
import {
  SlatesControlFlowNotifications,
  slatesControlFlowNotificationsByMethod
} from './controlFlow';
import {
  SlatesIdentifyRequests,
  slatesIdentifyRequestsByMethod,
  SlatesIdentifyResponses,
  slatesIdentifyResponsesByMethod
} from './identify';

export type SlatesNotifications =
  | SlatesAuthNotifications
  | SlatesConfigNotifications
  | SlatesControlFlowNotifications;

export type SlatesRequests =
  | SlatesActionRequests
  | SlatesAuthRequests
  | SlatesConfigRequests
  | SlatesIdentifyRequests;

export type SlatesResponses =
  | SlatesActionResponses
  | SlatesAuthResponses
  | SlatesConfigResponses
  | SlatesIdentifyResponses;

export let slatesResponsesByMethod = {
  ...slatesActionResponsesByMethod,
  ...slatesAuthResponsesByMethod,
  ...slatesConfigResponsesByMethod,
  ...slatesIdentifyResponsesByMethod
};

export let slatesRequestsByMethod = {
  ...slatesActionRequestsByMethod,
  ...slatesAuthRequestsByMethod,
  ...slatesConfigRequestsByMethod,
  ...slatesIdentifyRequestsByMethod
};

export let slatesNotificationsByMethod = {
  ...slatesAuthNotificationsByMethod,
  ...slatesConfigNotificationsByMethod,
  ...slatesControlFlowNotificationsByMethod
};

export type SlatesResponsesByMethod = {
  [key in keyof typeof slatesResponsesByMethod]: z.infer<
    (typeof slatesResponsesByMethod)[key]
  >;
};
