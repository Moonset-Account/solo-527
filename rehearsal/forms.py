import json
from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import Rehearsal, PropUsage, Attendance, CancelRecord, Play, Room, Prop, Member


class RehearsalForm(forms.ModelForm):
    props = forms.ModelMultipleChoiceField(
        queryset=Prop.objects.all(),
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label='选择道具'
    )
    prop_quantities = forms.CharField(
        required=False,
        widget=forms.HiddenInput,
        help_text='JSON格式的道具数量'
    )

    class Meta:
        model = Rehearsal
        fields = ['play', 'room', 'director', 'members', 'date', 'start_time', 'end_time', 'need_lighting', 'notes']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'start_time': forms.TimeInput(attrs={'type': 'time'}),
            'end_time': forms.TimeInput(attrs={'type': 'time'}),
            'members': forms.CheckboxSelectMultiple,
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        self.fields['play'].queryset = Play.objects.filter(status__in=['preparing', 'rehearsing', 'performing'])
        self.fields['room'].queryset = Room.objects.filter(is_available=True)
        self.fields['director'].queryset = Member.objects.filter(role__in=['director', 'admin'])
        self.fields['members'].queryset = Member.objects.all()

    def clean(self):
        cleaned_data = super().clean()
        date = cleaned_data.get('date')
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')
        room = cleaned_data.get('room')
        need_lighting = cleaned_data.get('need_lighting')
        members = cleaned_data.get('members', [])
        prop_quantities_str = self.data.get('prop_quantities', '{}')

        if date and start_time and end_time and room:
            if start_time >= end_time:
                raise ValidationError('结束时间必须晚于开始时间')

            if date < timezone.localdate():
                raise ValidationError('排练日期不能早于今天')

            if need_lighting and not room.has_lighting:
                raise ValidationError(f'{room.name} 没有灯光设备，请选择其他排练室')

            if members and len(members) > room.capacity:
                raise ValidationError(f'{room.name} 最多容纳 {room.capacity} 人，当前选择了 {len(members)} 人')

            rehearsal = Rehearsal(
                room=room,
                date=date,
                start_time=start_time,
                end_time=end_time
            )
            if self.instance:
                rehearsal.pk = self.instance.pk
            conflicts = rehearsal.get_conflicts()
            if conflicts:
                conflict_info = '; '.join([f'{c.play.title} ({c.date} {c.start_time}-{c.end_time})' for c in conflicts])
                raise ValidationError(f'时间冲突！该时段已有排练：{conflict_info}')

        try:
            prop_quantities = json.loads(prop_quantities_str) if prop_quantities_str else {}
        except (json.JSONDecodeError, Exception):
            prop_quantities = {}

        if date and prop_quantities:
            for prop_id, qty in prop_quantities.items():
                try:
                    prop = Prop.objects.get(id=prop_id)
                    qty = int(qty)
                    available = prop.available_quantity(date)
                    if qty > available:
                        raise ValidationError(
                            f'道具库存不足：{prop.name}，可用 {available} 件，需要 {qty} 件'
                        )
                except (Prop.DoesNotExist, ValueError, ValidationError):
                    raise
                except Exception:
                    pass

        return cleaned_data


class AttendanceForm(forms.ModelForm):
    class Meta:
        model = Attendance
        fields = ['status', 'notes']


class CancelRehearsalForm(forms.ModelForm):
    class Meta:
        model = CancelRecord
        fields = ['reason']
        widgets = {
            'reason': forms.Textarea(attrs={'rows': 4}),
        }


class CheckInForm(forms.Form):
    member_id = forms.IntegerField(widget=forms.HiddenInput)
