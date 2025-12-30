import { createHono } from '@lowerdeck/hono';
import { Paginator } from '@lowerdeck/pagination';
import { paginatorSchema } from '../../lib/paginatorSchema';
import { useValidation } from '../../lib/validator';
import { changeNotificationPresenter } from '../../presenters';
import { changeNotificationService } from '../../services';
import { useAuthRequired } from './_app';

export let slatesController = createHono()
  .get('', useValidation('query', paginatorSchema), async c => {
    let auth = await useAuthRequired(c);
    let query = c.req.valid('query');

    let paginator = await changeNotificationService.listChangeNotifications({
      instance: auth.instance
    });
    let list = await paginator.run(query);

    return c.json(await Paginator.presentLight(list, changeNotificationPresenter));
  })
  .get(':changeNotificationId', async c => {
    let auth = await useAuthRequired(c);

    let slate = await changeNotificationService.getChangeNotificationById({
      id: c.req.param('changeNotificationId'),
      instance: auth.instance
    });

    return c.json(await changeNotificationPresenter(slate));
  });
