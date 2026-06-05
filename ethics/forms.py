from django import forms
from .models import Project, MaterialVersion, ReviewComment, Resubmission, ReviewAssignment


class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['title', 'project_code', 'department', 'description', 'researchers']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'researchers': forms.CheckboxSelectMultiple(),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        from users.models import User
        self.fields['researchers'].queryset = User.objects.filter(role=User.Role.RESEARCHER)


class MaterialVersionForm(forms.ModelForm):
    class Meta:
        model = MaterialVersion
        fields = ['title', 'file', 'description']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }


class ReviewCommentForm(forms.ModelForm):
    class Meta:
        model = ReviewComment
        fields = ['clause', 'content']
        widgets = {
            'content': forms.Textarea(attrs={'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['clause'].required = False


class ResubmissionForm(forms.ModelForm):
    class Meta:
        model = Resubmission
        fields = ['addressed_comments', 'response_note']
        widgets = {
            'addressed_comments': forms.CheckboxSelectMultiple(),
            'response_note': forms.Textarea(attrs={'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        project = kwargs.pop('project', None)
        super().__init__(*args, **kwargs)
        if project:
            self.fields['addressed_comments'].queryset = project.review_comments.filter(
                status=ReviewComment.Status.PENDING
            ).select_related('clause', 'reviewer')


class ReviewAssignmentForm(forms.ModelForm):
    class Meta:
        model = ReviewAssignment
        fields = ['committee_member', 'material_types']
        widgets = {
            'material_types': forms.CheckboxSelectMultiple(),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from users.models import User
        self.fields['committee_member'].queryset = User.objects.filter(
            role=User.Role.COMMITTEE
        )


class ProjectFilterForm(forms.Form):
    STATUS_CHOICES = [('', '全部状态')] + Project.Status.choices
    status = forms.ChoiceField(choices=STATUS_CHOICES, required=False)
    keyword = forms.CharField(required=False, label='关键词')
    department = forms.CharField(required=False, label='部门')
    start_date = forms.DateField(required=False, widget=forms.DateInput(attrs={'type': 'date'}))
    end_date = forms.DateField(required=False, widget=forms.DateInput(attrs={'type': 'date'}))
