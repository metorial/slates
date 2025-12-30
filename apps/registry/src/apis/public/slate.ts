import { forbiddenError, ServiceError } from '@lowerdeck/error';
import { createHono } from '@lowerdeck/hono';
import { Paginator } from '@lowerdeck/pagination';
import { z } from 'zod';
import { paginatorSchema } from '../../lib/paginatorSchema';
import { useValidation } from '../../lib/validator';
import { slatePresenter, slateVersionPresenter } from '../../presenters';
import { slateService, slateVersionService } from '../../services';
import { storage } from '../../storage';
import { useAuth } from './_app';

export let slatesController = createHono()
  .get(
    '',
    useValidation(
      'query',
      paginatorSchema.extend({
        scopeId: z.string().optional(),
        userId: z.string().optional(),
        workspaceId: z.string().optional()
      })
    ),
    async c => {
      let auth = await useAuth(c);
      let query = c.req.valid('query');

      let paginator = await slateService.listSlates({
        instance: auth.instance,
        scopeIds: query.scopeId?.split(','),
        userIds: query.userId?.split(','),
        workspaceIds: query.workspaceId?.split(',')
      });
      let list = await paginator.run(query);

      return c.json(await Paginator.presentLight(list, slatePresenter));
    }
  )
  .get(':scopeId/:slateId', async c => {
    let auth = await useAuth(c);

    let slate = await slateService.getSlateById({
      instance: auth.instance,
      id: `${c.req.param('scopeId')}/${c.req.param('slateId')}`
    });

    return c.json(await slatePresenter(slate));
  })
  .post(
    ':scopeId/:slateId/versions',
    useValidation(
      'json',
      z.object({
        contentBase64: z.string(),
        access: z.enum(['public', 'private'])
      })
    ),
    async c => {
      let auth = await useAuth(c);
      if (auth.type != 'user') {
        throw new ServiceError(
          forbiddenError({
            message: 'Cannot publish slate without user authentication'
          })
        );
      }

      let body = await c.req.valid('json');

      let slateVersion = await slateVersionService.publishSlateVersion({
        user: auth.user,
        input: {
          scopeIdentifier: c.req.param('scopeId'),
          slateIdentifier: c.req.param('slateId'),

          access: body.access,
          contentBase64: body.contentBase64
        }
      });

      return c.json(await slateVersionPresenter(slateVersion));
    }
  )
  .get(':scopeId/:slateId/versions', useValidation('query', paginatorSchema), async c => {
    let auth = await useAuth(c);
    let query = c.req.valid('query');

    let slate = await slateService.getSlateById({
      instance: auth.instance,
      id: `${c.req.param('scopeId')}/${c.req.param('slateId')}`
    });

    let paginator = await slateVersionService.listSlateVersions({ slate });
    let list = await paginator.run(query);

    return c.json(await Paginator.presentLight(list, slateVersionPresenter));
  })
  .get(':scopeId/:slateId/versions/:versionId', async c => {
    let auth = await useAuth(c);

    let slate = await slateService.getSlateById({
      instance: auth.instance,
      id: `${c.req.param('scopeId')}/${c.req.param('slateId')}`
    });

    let slateVersion = await slateVersionService.getSlateVersionById({
      slate,
      id: c.req.param('versionId')
    });

    return c.json(await slateVersionPresenter(slateVersion));
  })
  .get(':scopeId/:slateId/versions/:versionId/download', async c => {
    let auth = await useAuth(c);

    let slate = await slateService.getSlateById({
      instance: auth.instance,
      id: `${c.req.param('scopeId')}/${c.req.param('slateId')}`
    });

    let slateVersion = await slateVersionService.getSlateVersionById({
      slate,
      id: c.req.param('versionId')
    });

    let { url } = await storage.getPublicURL(
      slateVersion.bundleArtifact.bucket,
      slateVersion.bundleArtifact.storageKey,
      60
    );

    return c.redirect(url);
  });
