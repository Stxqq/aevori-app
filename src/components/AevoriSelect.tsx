import * as Select from '@radix-ui/react-select';
import {Check,ChevronDown,ChevronUp} from '../MotionIcon';

type Option = {value:string;label:string;disabled?:boolean};
type Props = {
  label:string;
  value:string;
  onValueChange:(value:string)=>void;
  options:Option[];
  disabled?:boolean;
  className?:string;
};

/** Shared keyboard-accessible select for AEVORI's menus and forms. */
export default function AevoriSelect({label,value,onValueChange,options,disabled,className=''}:Props){
  return <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
    <Select.Trigger type="button" className={`aevori-select-trigger ${className}`} aria-label={label}>
      <Select.Value/>
      <Select.Icon className="aevori-select-chevron"><ChevronDown size={14}/></Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content className="aevori-select-menu" position="popper" sideOffset={6} collisionPadding={12} aria-label={label}>
        <Select.ScrollUpButton className="aevori-select-scroll"><ChevronUp size={14}/></Select.ScrollUpButton>
        <Select.Viewport className="aevori-select-options">
          {options.map(option=><Select.Item key={option.value} value={option.value} disabled={option.disabled} className="aevori-select-option">
            <Select.ItemText>{option.label}</Select.ItemText>
            <Select.ItemIndicator className="aevori-select-check"><Check size={15}/></Select.ItemIndicator>
          </Select.Item>)}
        </Select.Viewport>
        <Select.ScrollDownButton className="aevori-select-scroll"><ChevronDown size={14}/></Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>;
}
