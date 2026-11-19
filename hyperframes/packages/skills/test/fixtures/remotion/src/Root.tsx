import { Composition } from 'remotion';
import { HelloWorld } from './HelloWorld';

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={120}
        fps={FPS}
        width={1280}
        height={720}
        defaultProps={{ titleText: 'Welcome to Remotion', titleColor: '#000000' }}
      />
    </>
  );
};
