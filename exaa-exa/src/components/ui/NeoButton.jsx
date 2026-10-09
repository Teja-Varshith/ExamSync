import { Button } from '@cred/neopop-web/lib/components';
import { Loader2 } from 'lucide-react';
import { buttonColors } from '../../theme/neopop';
import './ui.css';

const SIZES = {
  small: { height: '34px', padding: '0 14px', iconHeight: '14px', font: 12, icon: 14 },
  medium: { height: '42px', padding: '0 20px', iconHeight: '16px', font: 14, icon: 16 },
  big: { height: '52px', padding: '0 28px', iconHeight: '20px', font: 16, icon: 18 },
};

/**
 * NeoPOP Button with ExamSync colour variants.
 *
 * variant: primary | secondary | light | premium | success | danger
 * kind:    elevated (3D plunk, default) | flat
 */
export default function NeoButton({
  variant = 'primary',
  kind = 'elevated',
  size = 'medium',
  fullWidth = false,
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  showArrow = false,
  className = '',
  children,
  ...rest
}) {
  const s = SIZES[size] || SIZES.medium;
  const colorConfig = buttonColors[variant] || buttonColors.primary;

  return (
    <Button
      kind={kind}
      colorMode="dark"
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      showArrow={showArrow}
      colorConfig={colorConfig}
      spacingConfig={{ height: s.height, padding: s.padding, iconHeight: s.iconHeight }}
      textStyle={{ fontType: 'body', fontSize: s.font, fontWeight: 700 }}
      className={`neo-btn ${fullWidth ? 'neo-btn--full' : ''} ${className}`}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className="neo-btn__label">
        {loading ? <Loader2 size={s.icon} className="neo-spin" /> : Icon && <Icon size={s.icon} strokeWidth={2.4} />}
        {children}
        {IconRight && !loading && <IconRight size={s.icon} strokeWidth={2.4} />}
      </span>
    </Button>
  );
}
