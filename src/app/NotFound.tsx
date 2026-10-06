import { Link } from 'react-router-dom';
import { ui } from '../i18n/ui';
import { useStore } from '../state/store';

export function NotFound() {
  const lang = useStore((s) => s.lang);
  return (
    <div className="not-found">
      <h1>{ui(lang, 'notFound')}</h1>
      <p>{ui(lang, 'notFoundBody')}</p>
      <Link className="btn btn-primary" to={`/${lang}`}>
        {ui(lang, 'backHome')}
      </Link>
    </div>
  );
}
