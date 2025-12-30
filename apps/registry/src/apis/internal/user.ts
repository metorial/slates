import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { tokenPresenter, userPresenter } from '../../presenters';
import { tokenService, userService } from '../../services';
import { app } from './_app';
import { instanceApp } from './instance';

export let userApp = instanceApp.use(async ctx => {
  let userId = ctx.body.userId;
  if (!userId) throw new Error('User ID is required');

  let user = await userService.getUserById({
    id: userId,
    instance: ctx.instance
  });

  return { user };
});

export let userController = app.controller({
  create: instanceApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),

        name: v.string(),
        identifier: v.string()
      })
    )
    .do(async ctx => {
      let user = await userService.createUser({
        instance: ctx.instance,
        input: {
          name: ctx.input.name,
          identifier: ctx.input.identifier
        }
      });
      return userPresenter(user);
    }),

  list: instanceApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          instanceId: v.string()
        })
      )
    )
    .do(async ctx => {
      let paginator = await userService.listUsers({
        instance: ctx.instance
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, userPresenter);
    }),

  get: userApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),
        userId: v.string()
      })
    )
    .do(async ctx => userPresenter(ctx.user)),

  update: userApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),
        userId: v.string(),

        name: v.optional(v.string()),
        description: v.optional(v.string()),
        links: v.optional(v.array(v.object({ url: v.string(), label: v.string() })))
      })
    )
    .do(async ctx => {
      let user = await userService.updateUser({
        user: ctx.user,
        input: {
          name: ctx.input.name,
          description: ctx.input.description,
          links: ctx.input.links
        }
      });

      return userPresenter(user);
    }),

  token: app.controller({
    create: userApp
      .handler()
      .input(
        v.object({
          instanceId: v.string(),
          userId: v.string(),

          name: v.string()
        })
      )
      .do(async ctx => {
        let token = await tokenService.createToken({
          user: ctx.user,
          input: {
            name: ctx.input.name
          }
        });

        return {
          ...tokenPresenter(token),
          secret: token.secret
        };
      }),

    list: userApp
      .handler()
      .input(
        Paginator.validate(
          v.object({
            instanceId: v.string(),
            userId: v.string()
          })
        )
      )
      .do(async ctx => {
        let paginator = await tokenService.listTokens({
          user: ctx.user
        });

        let list = await paginator.run(ctx.input);

        return Paginator.presentLight(list, tokenPresenter);
      }),

    get: userApp
      .handler()
      .input(
        v.object({
          instanceId: v.string(),
          userId: v.string(),

          tokenId: v.string()
        })
      )
      .do(async ctx => {
        let token = await tokenService.getTokenById({
          id: ctx.input.tokenId,
          user: ctx.user
        });

        return tokenPresenter(token);
      }),

    delete: userApp
      .handler()
      .input(
        v.object({
          instanceId: v.string(),
          userId: v.string(),

          tokenId: v.string()
        })
      )
      .do(async ctx => {
        let token = await tokenService.getTokenById({
          id: ctx.input.tokenId,
          user: ctx.user
        });

        token = await tokenService.deleteToken({
          token
        });

        return tokenPresenter(token);
      })
  })
});
