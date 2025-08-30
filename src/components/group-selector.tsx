import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'phosphor-react';

interface GroupSelectorProps {
  selectedGroup: string;
  onGroupChange: (group: string) => void;
}

const groups = [
  { value: 'S12', label: 'Section 12' },
  { value: 'DataScience', label: 'Data Science' },
  { value: 'AI', label: 'AI' },
  { value: 'Batch5', label: 'Batch 5' },
  { value: 'B76', label: 'Batch 76' },
];

const GroupSelector: React.FC<GroupSelectorProps> = ({
  selectedGroup,
  onGroupChange,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        <Users className="inline-block mr-2" size={16} />
        Select Group
      </label>
      <Select value={selectedGroup} onValueChange={onGroupChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a group" />
        </SelectTrigger>
        <SelectContent>
          {groups.map((group) => (
            <SelectItem key={group.value} value={group.value}>
              {group.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GroupSelector;
