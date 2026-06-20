from django.db import models


class OrganizationScopedModel(models.Model):
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='%(class)s_set',
        verbose_name='所属组织'
    )

    class Meta:
        abstract = True


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created',
        verbose_name='创建人'
    )
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated',
        verbose_name='更新人'
    )

    class Meta:
        abstract = True


class BaseModel(OrganizationScopedModel, TimestampedModel):
    class Meta:
        abstract = True


class ChoiceEnum:
    @classmethod
    def choices(cls):
        return [(v.value, v.label) for v in cls.__members__.values()]

    @classmethod
    def values(cls):
        return [v.value for v in cls.__members__.values()]
