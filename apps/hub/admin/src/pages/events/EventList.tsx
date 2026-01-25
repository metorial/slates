import { renderWithPagination } from '@metorial-io/data-hooks';
import {
  Badge,
  Flex,
  Group,
  InlineCopy,
  RenderDate,
  Spacer,
  Text,
  Title
} from '@metorial-io/ui';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { styled } from 'styled-components';
import { BackLink } from '../../components/BackLink.js';
import { EmptyState, FilterButton, ListItemRow, MonoCode, TextLink } from '../../components/styled.js';
import { eventTypeColors } from '../../constants/statusColors.js';
import { useAllEvents, useSlate, useSlateEvents } from '../../state/index.js';

type EventFilter = 'all' | 'deployment' | 'discovery' | 'version';

let EventItemWrapper = styled.div`
  cursor: pointer;
`;

let ExpandedContent = styled(Flex)`
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
`;

export let EventList = () => {
  let { slateId } = useParams<{ slateId?: string }>();
  let [typeFilter, setTypeFilter] = useState<EventFilter>('all');
  let [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  let slate = useSlate(slateId);
  let allEvents = useAllEvents();
  let slateEvents = useSlateEvents(slateId);

  let events = slateId ? slateEvents : allEvents;
  let slateName = slate.data?.name || slate.data?.identifier;

  let emptyState = (
    <EmptyState direction="column" align="center">
      <Title size="4" weight="strong">
        No events found
      </Title>
      <Spacer size={8} />
      <Text size="2" color="gray600">
        {typeFilter === 'all'
          ? 'No events have been recorded yet.'
          : `No ${typeFilter} events found.`}
      </Text>
    </EmptyState>
  );

  return (
    <Flex direction="column" gap={32}>
      {slateId && (
        <BackLink to={`/slates/${slateId}`}>Back to {slateName || 'Slate'}</BackLink>
      )}

      <Flex justify="space-between" align="center">
        <div>
          <Title size="6" weight="strong">
            {slateId ? `Events for ${slateName || 'Slate'}` : 'Events'}
          </Title>
          <Spacer size={4} />
          <Text size="2" color="gray600">
            {slateId
              ? 'All events for this slate.'
              : 'Timeline of all slate events including deployments, discoveries, and version changes.'}
          </Text>
        </div>
      </Flex>

      <Flex gap={8}>
        <FilterButton $active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
          All Events
        </FilterButton>
        <FilterButton
          $active={typeFilter === 'deployment'}
          onClick={() => setTypeFilter('deployment')}
        >
          Deployments
        </FilterButton>
        <FilterButton
          $active={typeFilter === 'discovery'}
          onClick={() => setTypeFilter('discovery')}
        >
          Discoveries
        </FilterButton>
        <FilterButton
          $active={typeFilter === 'version'}
          onClick={() => setTypeFilter('version')}
        >
          Version Changes
        </FilterButton>
      </Flex>

      {renderWithPagination(events, { emptyState })(({ data }) => {
        let items = data.items;
        let filteredEvents =
          typeFilter === 'all' ? items : items.filter(e => e.type.startsWith(typeFilter));

        if (filteredEvents.length === 0) {
          return emptyState;
        }

        return (
          <Group.Wrapper>
            {filteredEvents.map(event => {
              let isExpanded = expandedEventId === event.id;
              return (
                <EventItemWrapper
                  key={event.id}
                  onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                >
                  <ListItemRow align="center" justify="space-between">
                    <Flex align="center" gap={16}>
                      <Badge color={eventTypeColors[event.type] || 'gray'}>
                        {event.type.replace(/_/g, ' ')}
                      </Badge>
                      <Text size="2" color={event.message ? undefined : 'gray600'}>
                        {event.message || '-'}
                      </Text>
                    </Flex>
                    <Flex align="center" gap={16}>
                      {!slateId && event.slate && (
                        <TextLink
                          to={`/slates/${event.slate.id}`}
                          onClick={e => e.stopPropagation()}
                        >
                          {event.slate.name || event.slate.identifier}
                        </TextLink>
                      )}
                      <RenderDate date={event.createdAt} />
                    </Flex>
                  </ListItemRow>
                  {isExpanded && (
                    <ExpandedContent direction="column" gap={12}>
                      <Flex gap={32} wrap="wrap">
                        <Flex direction="column" gap={4}>
                          <Text size="1" color="gray600">
                            Event ID
                          </Text>
                          <Flex align="center" gap={6}>
                            <MonoCode>{event.id}</MonoCode>
                            <InlineCopy value={event.id} />
                          </Flex>
                        </Flex>
                        <Flex direction="column" gap={4}>
                          <Text size="1" color="gray600">
                            Version
                          </Text>
                          <Badge color="blue" size="1">
                            v{event.version?.version ?? '-'}
                          </Badge>
                        </Flex>
                        {event.slate && (
                          <Flex direction="column" gap={4}>
                            <Text size="1" color="gray600">
                              Slate Identifier
                            </Text>
                            <MonoCode>{event.slate.identifier}</MonoCode>
                          </Flex>
                        )}
                        {event.deployment && event.type.startsWith('deployment') && (
                          <Flex direction="column" gap={4}>
                            <Text size="1" color="gray600">
                              Deployment
                            </Text>
                            <Link
                              to={`/slates/${event.slate?.id}/deployments/${event.deployment.id}`}
                              style={{ textDecoration: 'none' }}
                              onClick={e => e.stopPropagation()}
                            >
                              <Badge color="blue" size="1">
                                View Deployment →
                              </Badge>
                            </Link>
                          </Flex>
                        )}
                        {event.discovery && event.type.startsWith('discovery') && (
                          <Flex direction="column" gap={4}>
                            <Text size="1" color="gray600">
                              Discovery
                            </Text>
                            <Link
                              to={`/slates/${event.slate?.id}/versions/${event.version?.id}/discoveries/${event.discovery.id}`}
                              style={{ textDecoration: 'none' }}
                              onClick={e => e.stopPropagation()}
                            >
                              <Badge color="blue" size="1">
                                View Discovery →
                              </Badge>
                            </Link>
                          </Flex>
                        )}
                      </Flex>
                      {event.message && (
                        <Flex direction="column" gap={4}>
                          <Text size="1" color="gray600">
                            Full Message
                          </Text>
                          <Text size="2" style={{ whiteSpace: 'pre-wrap' }}>
                            {event.message}
                          </Text>
                        </Flex>
                      )}
                    </ExpandedContent>
                  )}
                </EventItemWrapper>
              );
            })}
          </Group.Wrapper>
        );
      })}
    </Flex>
  );
};
