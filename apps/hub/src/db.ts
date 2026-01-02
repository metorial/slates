import { PrismaPg } from '@prisma/adapter-pg';
import {
  type SlatesAction as ProtoSlatesAction,
  type SlateAuthenticationMethod,
  type SlatesMessageProviderIdentifyResponse
} from '@slates/proto';
import { PrismaClient } from '../prisma/generated/client';

let adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export let db = new PrismaClient({ adapter });

declare global {
  namespace PrismaJson {
    type SlateJson = {
      name: string;
      version: string;
      description?: string;
    };

    type SlateDeploymentProviderDeploymentInfo = {
      functionId: string;
      functionVersionId?: string;
      functionDeploymentId: string;
    } | null;

    type SlateConfigSchema = any;

    type SlateAuthMethod = SlateAuthenticationMethod;
    type SlateAction = ProtoSlatesAction;

    type SlateAuthMethods = SlateAuthenticationMethod[];
    type SlateActions = ProtoSlatesAction[];

    type SlateProviderInfo = SlatesMessageProviderIdentifyResponse['result']['provider'];
  }
}
