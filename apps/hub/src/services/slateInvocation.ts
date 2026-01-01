import { badRequestError, ServiceError } from '@lowerdeck/error';
import { generatePlainId } from '@lowerdeck/id';
import { Service } from '@lowerdeck/service';
import {
  slatesResponsesByMethod,
  type SlatesNotifications,
  type SlatesParticipant,
  type SlatesRequests,
  type SlatesResponses
} from '@slates/proto';
import { z } from 'zod';
import type { SlateVersion } from '../../prisma/generated/client';
import { functionBay, functionBayTenant } from '../functionBay';
import { hub } from '../hub';

type Request = SlatesNotifications | SlatesRequests;
type Response = SlatesNotifications | SlatesResponses;

interface BaseParams {
  slateVersion: SlateVersion;
  participants: SlatesParticipant[];
}

class slateInvocationServiceImpl {
  private async invokeSlate(d: BaseParams & { messages: Request[] }) {
    if (!d.slateVersion.providerDeploymentInfo) {
      throw new ServiceError(badRequestError({ message: 'Slate version is not deployed' }));
    }

    let messages: Request[] = [
      { jsonrpc: '2.0', method: 'slates/hello', params: { protocol: 'slates@2026-01-01' } },
      {
        jsonrpc: '2.0',
        method: 'slates/participant.set',
        params: {
          participants: [...d.participants, { type: 'hub', id: hub.identifier, name: 'Hub' }]
        }
      },
      ...d.messages
    ];

    let invocation = await functionBay.function.invoke({
      tenantId: functionBayTenant.id,
      functionId: d.slateVersion.providerDeploymentInfo.functionId,
      payload: { messages }
    });

    if (invocation.type == 'error') {
      return {
        status: 'error' as const,
        invocation,

        mapMessage: <Key extends keyof typeof slatesResponsesByMethod>(
          key: Key
        ): {
          status: 'error';
          invocation: typeof invocation;
          data: never;
        } => {
          throw new ServiceError(
            badRequestError({ message: `Cannot map message for errored invocation` })
          );
        }
      };
    }

    let resultMessages = (invocation.result as any).messages as Response[];

    return {
      status: 'success' as const,

      invocation,
      messages: resultMessages,

      mapMessage: <Key extends keyof typeof slatesResponsesByMethod>(
        key: Key
      ): {
        status: 'success';
        invocation: typeof invocation;
        data: z.infer<(typeof slatesResponsesByMethod)[Key]>['result'];
      } => {
        let inputMessage = messages.find(m => m.method == key);
        if (!inputMessage) {
          throw new ServiceError(
            badRequestError({ message: `No input message found for method ${key}` })
          );
        }

        if ('id' in inputMessage && !inputMessage.id) {
          throw new ServiceError(
            badRequestError({ message: `Input message for method ${key} has no id` })
          );
        }

        let outputMessage = resultMessages.find(
          m => 'id' in m && m.id == (inputMessage as any).id
        );
        if (!outputMessage) {
          throw new ServiceError(
            badRequestError({ message: `No output message found for method ${key}` })
          );
        }

        let valRes = z.object(slatesResponsesByMethod[key]).safeParse(outputMessage);
        if (!valRes.success) {
          throw new ServiceError(
            badRequestError({
              message: `Output message for method ${key} is invalid: ${valRes.error.message}`
            })
          );
        }

        // TODO: handle error responses
        return (valRes.data as any).result;
      }
    };
  }

  private async invokeSlateWithSession(
    d: BaseParams & {
      messages: Request[];
      config: Record<string, any>;
      session: { id: string; state: Record<string, any> };
      auth: { authenticationMethodId: string; data: Record<string, any> };
    }
  ) {
    return this.invokeSlate({
      ...d,
      messages: [
        {
          jsonrpc: '2.0',
          method: 'slates/config.set',
          params: { config: d.config }
        },
        {
          jsonrpc: '2.0',
          method: 'slates/auth.set',
          params: {
            authenticationMethodId: d.auth.authenticationMethodId,
            output: d.auth.data
          }
        },
        {
          jsonrpc: '2.0',
          method: 'slates/session.start',
          params: { sessionId: d.session.id, state: d.session.state }
        },
        ...d.messages
      ]
    });
  }

  private getRequestParams<T extends string>(method: T) {
    return { jsonrpc: '2.0' as const, id: generatePlainId(10), method };
  }

  async sendUpdatedConfig(
    d: BaseParams & {
      previousConfig: Record<string, any> | null;
      newConfig: Record<string, any>;
    }
  ) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/config.changed'),
          params: {
            previousConfig: d.previousConfig,
            newConfig: d.newConfig
          }
        }
      ]
    });
    return invocation.mapMessage('slates/config.changed');
  }

  async getDefaultConfig(d: BaseParams & {}) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [{ ...this.getRequestParams('slates/config.get_default'), params: {} }]
    });
    return invocation.mapMessage('slates/config.get_default');
  }

  async getConfigSchema(d: BaseParams & {}) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [{ ...this.getRequestParams('slates/config.schema.get'), params: {} }]
    });
    return invocation.mapMessage('slates/config.schema.get');
  }

  async getProviderInfo(d: BaseParams & {}) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [{ ...this.getRequestParams('slates/provider.identify'), params: {} }]
    });
    return invocation.mapMessage('slates/provider.identify');
  }

  async listAuthMethods(d: BaseParams & {}) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [{ ...this.getRequestParams('slates/auth.methods.list'), params: {} }]
    });
    return invocation.mapMessage('slates/auth.methods.list');
  }

  async getAuthMethod(d: BaseParams & { authenticationMethodId: string }) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/auth.method.get'),
          params: { authenticationMethodId: d.authenticationMethodId }
        }
      ]
    });
    return invocation.mapMessage('slates/auth.method.get');
  }

  async getDefaultAuthInput(d: BaseParams & { authenticationMethodId: string }) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/auth.input.get_default'),
          params: { authenticationMethodId: d.authenticationMethodId }
        }
      ]
    });
    return invocation.mapMessage('slates/auth.input.get_default');
  }

  async sendUpdatedAuthInput(
    d: BaseParams & {
      authenticationMethodId: string;
      previousInput: Record<string, any> | null;
      newInput: Record<string, any>;
    }
  ) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/auth.input.changed'),
          params: {
            authenticationMethodId: d.authenticationMethodId,
            previousInput: d.previousInput,
            newInput: d.newInput
          }
        }
      ]
    });
    return invocation.mapMessage('slates/auth.input.changed');
  }

  async getAuthOutput(
    d: BaseParams & { authenticationMethodId: string; input: Record<string, any> }
  ) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/auth.output.get'),
          params: {
            authenticationMethodId: d.authenticationMethodId,
            input: d.input
          }
        }
      ]
    });
    return invocation.mapMessage('slates/auth.output.get');
  }

  async getOAuthCallback(
    d: BaseParams & {
      authenticationMethodId: string;
      code: string;
      state: string;
      redirectUri: string;
      input: Record<string, any>;
      clientId: string;
      clientSecret: string;
      scopes: string[];
    }
  ) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/auth.authorization_callback.handle'),
          params: {
            authenticationMethodId: d.authenticationMethodId,
            code: d.code,
            state: d.state,
            redirectUri: d.redirectUri,
            input: d.input,
            clientId: d.clientId,
            clientSecret: d.clientSecret,
            scopes: d.scopes
          }
        }
      ]
    });
    return invocation.mapMessage('slates/auth.authorization_callback.handle');
  }

  async getOAuthUrl(
    d: BaseParams & {
      authenticationMethodId: string;
      redirectUri: string;
      state: string;
      input: Record<string, any>;
      clientId: string;
      clientSecret: string;
      scopes: string[];
    }
  ) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/auth.authorization_url.get'),
          params: {
            authenticationMethodId: d.authenticationMethodId,
            redirectUri: d.redirectUri,
            state: d.state,
            input: d.input,
            clientId: d.clientId,
            clientSecret: d.clientSecret,
            scopes: d.scopes
          }
        }
      ]
    });
    return invocation.mapMessage('slates/auth.authorization_url.get');
  }

  async getAuthProfile(
    d: BaseParams & {
      authenticationMethodId: string;
      output: Record<string, any>;
      input: Record<string, any>;
      scopes: string[];
    }
  ) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/auth.profile.get'),
          params: {
            authenticationMethodId: d.authenticationMethodId,
            output: d.output,
            input: d.input,
            scopes: d.scopes
          }
        }
      ]
    });
    return invocation.mapMessage('slates/auth.profile.get');
  }

  async refreshOAuthToken(
    d: BaseParams & {
      authenticationMethodId: string;
      output: Record<string, any>;
      input: Record<string, any>;
      clientId: string;
      clientSecret: string;
      scopes: string[];
    }
  ) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/auth.token_refresh.handle'),
          params: {
            authenticationMethodId: d.authenticationMethodId,
            output: d.output,
            input: d.input,
            clientId: d.clientId,
            clientSecret: d.clientSecret,
            scopes: d.scopes
          }
        }
      ]
    });
    return invocation.mapMessage('slates/auth.token_refresh.handle');
  }

  async listActions(d: BaseParams & {}) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [{ ...this.getRequestParams('slates/actions.list'), params: {} }]
    });
    return invocation.mapMessage('slates/actions.list');
  }

  async getAction(d: BaseParams & { actionId: string }) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/action.get'),
          params: { actionId: d.actionId }
        }
      ]
    });
    return invocation.mapMessage('slates/action.get');
  }

  async invokeToolAction(d: BaseParams & { actionId: string; input: Record<string, any> }) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/action.tool.invoke'),
          params: { actionId: d.actionId, input: d.input }
        }
      ]
    });
    return invocation.mapMessage('slates/action.tool.invoke');
  }

  async invokeTriggerMapper(d: BaseParams & { actionId: string; input: Record<string, any> }) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/action.trigger.map_event'),
          params: { actionId: d.actionId, input: d.input }
        }
      ]
    });
    return invocation.mapMessage('slates/action.trigger.map_event');
  }

  async pollTriggerForEvents(d: BaseParams & { actionId: string; state: any }) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/action.trigger.poll_events'),
          params: { actionId: d.actionId, state: d.state }
        }
      ]
    });
    return invocation.mapMessage('slates/action.trigger.poll_events');
  }

  async handleWebhookRequest(
    d: BaseParams & {
      actionId: string;
      url: string;
      method: string;
      headers: Record<string, string>;
      body: { encoding: 'base64'; content: string } | null;
      state: any;
    }
  ) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/action.trigger.webhook_handle'),
          params: {
            actionId: d.actionId,
            url: d.url,
            method: d.method,
            headers: d.headers,
            body: d.body,
            state: d.state
          }
        }
      ]
    });
    return invocation.mapMessage('slates/action.trigger.webhook_handle');
  }

  async registerWebhook(
    d: BaseParams & {
      actionId: string;
      webhookBaseUrl: string;
    }
  ) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/action.trigger.webhook_register'),
          params: {
            actionId: d.actionId,
            webhookBaseUrl: d.webhookBaseUrl
          }
        }
      ]
    });
    return invocation.mapMessage('slates/action.trigger.webhook_register');
  }

  async unregisterWebhook(
    d: BaseParams & {
      actionId: string;
      webhookBaseUrl: string;
      registrationDetails: any;
      state?: any;
    }
  ) {
    let invocation = await this.invokeSlate({
      ...d,
      messages: [
        {
          ...this.getRequestParams('slates/action.trigger.webhook_unregister'),
          params: {
            actionId: d.actionId,
            webhookBaseUrl: d.webhookBaseUrl,
            registrationDetails: d.registrationDetails,
            state: d.state
          }
        }
      ]
    });
    return invocation.mapMessage('slates/action.trigger.webhook_unregister');
  }
}

export let slateInvocationService = Service.create(
  'slateInvocationService',
  () => new slateInvocationServiceImpl()
).build();
