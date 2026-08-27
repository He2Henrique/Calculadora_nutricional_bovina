import { useEffect, useRef } from 'react';

interface Props {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  inputMode?: 'decimal' | 'text';
  placeholder?: string;
  readOnly?: boolean;
}

/**
 * Uncontrolled-by-design text input: keeps typing free of re-renders and
 * only reports the value on blur (mirrors the original app's onChange=blur
 * behavior). External updates (e.g. loading a saved mixture) still sync in,
 * but only while the field isn't focused, so they never clobber a keystroke.
 */
export default function CommitInput({ value, onCommit, className, inputMode, placeholder, readOnly }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.value !== value) {
      el.value = value;
    }
  }, [value]);

  return (
    <input
      ref={ref}
      className={className}
      defaultValue={value}
      inputMode={inputMode}
      placeholder={placeholder}
      readOnly={readOnly}
      onBlur={(e) => {
        if (e.target.value !== value) onCommit(e.target.value);
      }}
    />
  );
}
