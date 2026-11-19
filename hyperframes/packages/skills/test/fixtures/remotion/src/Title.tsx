import { interpolate, useCurrentFrame, Easing } from 'remotion';

export const Title: React.FC<{ titleText: string; titleColor: string }> = ({ titleText, titleColor }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 20], [60, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const fade = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <h1 style={{ fontSize: 90, fontWeight: 'bold', textAlign: 'center', color: titleColor, opacity: fade, transform: `translateY(${y}px)`, marginTop: 380 }}>
      {titleText}
    </h1>
  );
};
