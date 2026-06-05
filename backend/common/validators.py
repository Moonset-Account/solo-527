from django.core.exceptions import ValidationError
from django.utils import timezone


def validate_phone(value):
    if value and not value.isdigit():
        raise ValidationError('手机号必须为数字')
    if value and len(value) != 11:
        raise ValidationError('手机号必须为11位')


def validate_id_number(value):
    if value and len(value) not in (15, 18):
        raise ValidationError('身份证号长度不正确')


def validate_date_not_future(value):
    if value and value > timezone.now().date():
        raise ValidationError('日期不能是未来日期')


def validate_date_range(start_date, end_date):
    if start_date and end_date and start_date > end_date:
        raise ValidationError('开始日期不能晚于结束日期')


def validate_authorized_pickup(child_id, person_name, person_phone):
    from children.models import AuthorizedPickupPerson
    if not AuthorizedPickupPerson.objects.filter(
        child_id=child_id, name=person_name, phone=person_phone, is_active=True
    ).exists():
        raise ValidationError(f'{person_name} 不是该儿童的授权接送人')


def validate_class_permission(user, class_group):
    if user.role == 'admin':
        return True
    if user.role == 'teacher':
        if class_group and class_group.teacher != user:
            raise ValidationError('您没有该班级的操作权限')
        return True
    raise ValidationError('您没有操作权限')


class BaseValidator:
    def validate(self, data):
        errors = {}
        for field, validator in self.field_validators.items():
            value = data.get(field)
            if value is not None:
                try:
                    validator(value)
                except ValidationError as e:
                    errors[field] = str(e)
        if errors:
            raise ValidationError(errors)
        return data
