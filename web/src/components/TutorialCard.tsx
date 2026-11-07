import { Link } from 'react-router-dom';
import { Clock, ListOrdered } from 'lucide-react';
import type { Tutorial } from '../types/data_type';
import { MaterialBadge } from './Badges';
import SmartImage from './SmartImage';

export default function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Link to={`/tutorial/${tutorial.id}`} className="card tut-card">
      <div className="tut-media">
        <SmartImage src={tutorial.imageUrl} alt={tutorial.title} material={tutorial.material} />
        <span className="media-badge"><MaterialBadge material={tutorial.material} /></span>
      </div>
      <div className="tut-body">
        <h3>{tutorial.title}</h3>
        <div className="meta-row">
          <span><Clock size={14} />{tutorial.durationMinutes} menit</span>
          <span><ListOrdered size={14} />{tutorial.stepCount} langkah</span>
          <span className="xp">+{tutorial.xpReward} XP</span>
        </div>
      </div>
    </Link>
  );
}
