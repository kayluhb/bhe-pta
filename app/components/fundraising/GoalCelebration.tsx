import {type ComponentType, useEffect, useState} from 'react';

import eagleGoalLottie from './eagle-goal-lottie.json';
import goalConfettiLottie from './goal-confetti-lottie.json';

type CelebrationPlayerProps = {
  autoplay?: boolean;
  className?: string;
  loop?: boolean | number;
  src: object;
};

export function GoalCelebration() {
  const [Player, setPlayer] = useState<ComponentType<CelebrationPlayerProps> | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;

    let cancelled = false;
    void import('lottie-react').then((mod) => {
      if (!cancelled) {
        setPlayer(() => mod.LottieSvg as ComponentType<CelebrationPlayerProps>);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div aria-hidden="true" className="goal-celebration-wrap mt-2 flex justify-center">
      {Player ? (
        <div className="goal-celebration grid">
          <Player autoplay className="col-start-1 row-start-1" loop src={goalConfettiLottie} />
          <Player autoplay className="col-start-1 row-start-1" loop={2} src={eagleGoalLottie} />
        </div>
      ) : (
        <div className="goal-celebration" />
      )}
    </div>
  );
}
