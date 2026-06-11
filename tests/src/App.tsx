import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.hello', { name: 'Alice' })}</h1>
      <p>{t('common.welcome', { user: 'Bob' })}</p>
      <p>{t('common.items', { count: 5 })}</p>
      <p>{t('common.price', { amount: 99.99 })}</p>

      <button>{t('common.submit')}</button>
      <button>{t('common.cancel')}</button>

      <div>
        <button>{t('auth.login')}</button>
        <button>{t('auth.logout')}</button>
        <button>{t('auth.register')}</button>
        <a>{t('auth.forgot_password')}</a>
        <p>{t('auth.email_sent', { email: 'test@example.com' })}</p>
        <p>{t('auth.login_success', { username: 'Alice' })}</p>
        <p>{t('auth.error_invalid')}</p>
      </div>

      <div>
        <h2>{t('profile.title')}</h2>
        <button>{t('profile.edit')}</button>
        <button>{t('profile.save')}</button>
        <p>{t('profile.score', { score: 85, total: 100 })}</p>
        <p>{t('profile.update_success')}</p>
      </div>
    </div>
  );
}

export default App;
