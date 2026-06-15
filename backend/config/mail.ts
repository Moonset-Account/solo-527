import Env from '@ioc:Adonis/Core/Env'
import { MailConfig } from '@ioc:Adonis/Addons/Mail'

const mailConfig: MailConfig = {
  mailer: Env.get('MAIL_DRIVER', 'smtp'),
  mailers: {
    smtp: {
      driver: 'smtp',
      host: Env.get('SMTP_HOST', 'smtp.example.com'),
      port: Env.get('SMTP_PORT', '587'),
      auth: {
        user: Env.get('SMTP_USERNAME', ''),
        pass: Env.get('SMTP_PASSWORD', ''),
        type: 'login',
      },
    },
  },
}

export default mailConfig
