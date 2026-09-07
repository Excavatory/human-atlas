import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';
import {LocaleProvider} from '../lib/i18n';
createRoot(document.getElementById('root')!).render(
  <LocaleProvider>
    <Home/>
  </LocaleProvider>,
);
