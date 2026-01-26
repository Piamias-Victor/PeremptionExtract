import { Composition } from 'remotion';
import { Main } from './Main';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Presentation"
        component={Main}
        durationInFrames={600} // 20 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "PeremptionExtract",
          subtitle: "Gérez vos péremptions avec l'IA",
        }}
      />
    </>
  );
};
