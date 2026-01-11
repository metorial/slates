import { styled } from 'styled-components';
import { Link } from 'react-router-dom';
import { Flex } from '@metorial-io/ui';

// Empty state container used in list pages
export let EmptyState = styled(Flex)`
  padding: 80px 40px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  text-align: center;
`;

// Clickable list item link wrapper
export let ListItemLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
`;

// Row inside a list item
export let ListItemRow = styled(Flex)`
  padding: 14px 20px;
`;

// Monospace text for identifiers
export let MonoText = styled.span`
  font-family: monospace;
`;

// Monospace code block with background
export let MonoCode = styled.code`
  font-family: monospace;
  font-size: 12px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
`;

// Form content wrapper with max width
export let FormWrapper = styled.div`
  max-width: 480px;
`;

// Select dropdown styling
export let Select = styled.select`
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  transition: all 0.15s;
  cursor: pointer;

  &:hover {
    border-color: #cbd5e1;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

// Card container for list items
export let Card = styled.div`
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`;

// Danger button styling
export let DangerButton = styled.button`
  color: #dc2626;
  border-color: #fecaca;
`;

// File input styling
export let FileInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  transition: all 0.15s;

  &:hover {
    border-color: #cbd5e1;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::file-selector-button {
    padding: 6px 12px;
    margin-right: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
    color: #374151;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: #f1f5f9;
    }
  }
`;

// Table header row styling
export let TableHeaderRow = styled(Flex)`
  font-weight: 600;
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Slate logo image
export let SlateLogoImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  background: #f1f5f9;
`;

// Slate logo placeholder
export let SlateLogoPlaceholder = styled(Flex)`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  font-size: 16px;
  color: #94a3b8;
`;

// Action button link (like Publish button)
export let ActionLink = styled(Link)`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #3b82f6;
  background: #eff6ff;
  border-radius: 6px;
  text-decoration: none;

  &:hover {
    background: #dbeafe;
  }
`;

// Table column widths
export let TableColumn = styled.div<{ $width?: number; $flex?: number }>`
  ${p => p.$width && `width: ${p.$width}px;`}
  ${p => p.$flex && `flex: ${p.$flex};`}
`;
