type Props = {
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
  className?: string;
};

export function Checkbox({ checked, onCheckedChange, className }: Props) {
  return (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={className}
    />
  );
}
