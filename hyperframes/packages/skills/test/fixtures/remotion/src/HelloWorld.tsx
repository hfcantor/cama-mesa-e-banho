import { AbsoluteFill, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Title } from './Title';

export const HelloWorld: React.FC<{ titleText: string; titleColor: string }> = ({ titleText, titleColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 12 } });
  const opacity = interpolate(frame, [durationInFrames - 25, durationInFrames - 15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
      <AbsoluteFill style={{ opacity }}>
        <Sequence durationInFrames={60}>
          <Img src={staticFile('logo.png')} style={{ width: 240, margin: 'auto', transform: `scale(${logoScale})` }} />
        </Sequence>
        <Sequence from={35}>
          <Title titleText={titleText} titleColor={titleColor} />
        </Sequence>
        <Sequence from={75}>
          <p style={{ fontSize: 40, textAlign: 'center', marginTop: 520 }}>Edit src/HelloWorld.tsx</p>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
