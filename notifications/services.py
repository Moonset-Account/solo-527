from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import SMSMessage, Notification
from appointments.models import Appointment
from core.models import User


class SMSService:
    @staticmethod
    def _get_sms_config():
        return settings.SMS_SETTINGS

    @classmethod
    def send_appointment_reminder(cls, appointment: Appointment):
        if appointment.reminder_sent:
            return None

        patient = appointment.patient
        doctor = appointment.doctor
        date = appointment.daily_slot.date
        shift = appointment.daily_slot.get_shift_display()

        content = (
            f'【诊所复诊提醒】您好{patient.name}，您已预约{date} {shift} '
            f'{doctor.department.name} {doctor.name}医生的复诊。'
            f'预约号：{appointment.appointment_no}。请准时就诊，如需改期请提前联系护士台。'
        )

        sms = SMSMessage.objects.create(
            patient=patient,
            appointment=appointment,
            message_type='APPT_REMIND',
            phone_number=patient.phone,
            content=content,
        )

        cls._send(sms)
        appointment.reminder_sent = True
        appointment.save()
        return sms

    @classmethod
    def send_confirmation(cls, appointment: Appointment):
        patient = appointment.patient
        doctor = appointment.doctor
        date = appointment.daily_slot.date
        shift = appointment.daily_slot.get_shift_display()

        content = (
            f'【预约成功】您好{patient.name}，您已成功预约{date} {shift} '
            f'{doctor.department.name} {doctor.name}医生。'
            f'预约号：{appointment.appointment_no}。请按时就诊。'
        )

        sms = SMSMessage.objects.create(
            patient=patient,
            appointment=appointment,
            message_type='CONFIRM',
            phone_number=patient.phone,
            content=content,
        )
        cls._send(sms)
        return sms

    @classmethod
    def send_cancellation(cls, appointment: Appointment, reason: str = ''):
        patient = appointment.patient
        content = (
            f'【预约取消通知】您好{patient.name}，您的预约{appointment.appointment_no}已取消。'
            f'{reason} 如有疑问请联系护士台。'
        )

        sms = SMSMessage.objects.create(
            patient=patient,
            appointment=appointment,
            message_type='CANCEL',
            phone_number=patient.phone,
            content=content,
        )
        cls._send(sms)
        return sms

    @classmethod
    def send_no_show_alert_to_nurse(cls, patient):
        nurse_users = User.objects.filter(role='NURSE', is_active=True)
        message = (
            f'【爽约提醒】患者{patient.name}（病历号：{patient.patient_no}）'
            f'已累计爽约{patient.no_show_count}次，需要电话确认后续预约。'
        )

        for nurse in nurse_users:
            Notification.objects.create(
                user=nurse,
                title='患者爽约提醒',
                message=message,
                type='ALERT',
                related_url=f'/admin/patients/patientprofile/{patient.id}/change/'
            )

    @classmethod
    def _send(cls, sms: SMSMessage):
        config = cls._get_sms_config()
        if not config.get('ENABLED', False):
            sms.mark_sent('dummy_message_id')
            return True

        try:
            if config.get('PROVIDER') == 'dummy':
                sms.mark_sent('dummy_message_id')
                return True
        except Exception as e:
            sms.mark_failed(str(e))
            return False

    @classmethod
    def send_bulk_reminders(cls):
        from datetime import date, timedelta
        reminder_days = settings.APPOINTMENT_SETTINGS.get('REMINDER_DAYS_BEFORE', 1)
        target_date = date.today() + timedelta(days=reminder_days)

        appointments = Appointment.objects.filter(
            daily_slot__date=target_date,
            status='BOOKED',
            reminder_sent=False
        )

        sent_count = 0
        for apt in appointments:
            if cls.send_appointment_reminder(apt):
                sent_count += 1
        return sent_count


class NotificationService:
    @staticmethod
    def create_notification(user, title, message, type='INFO', related_url=''):
        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            type=type,
            related_url=related_url
        )

    @staticmethod
    def get_unread_count(user):
        return Notification.objects.filter(user=user, status='UNREAD').count()

    @staticmethod
    def mark_all_read(user):
        return Notification.objects.filter(user=user, status='UNREAD').update(
            status='READ',
            read_at=timezone.now()
        )
