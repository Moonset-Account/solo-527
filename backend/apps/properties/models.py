import uuid

from django.db import models

from apps.users.models import User


class Property(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField('民宿名称', max_length=100)
    address = models.CharField('地址', max_length=255)
    description = models.TextField('描述', blank=True)
    phone = models.CharField('联系电话', max_length=20, blank=True)
    cover_image = models.ImageField('封面图', upload_to='properties/covers/', null=True, blank=True)
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_properties',
        verbose_name='房东'
    )
    is_active = models.BooleanField('是否启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'property'
        verbose_name = '民宿'
        verbose_name_plural = '民宿'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class PropertyImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images', verbose_name='民宿')
    image = models.ImageField('图片', upload_to='properties/images/')
    caption = models.CharField('说明', max_length=100, blank=True)
    sort_order = models.IntegerField('排序', default=0)

    class Meta:
        db_table = 'property_image'
        verbose_name = '民宿图片'
        verbose_name_plural = '民宿图片'
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.property.name} - 图片'


class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='rooms', verbose_name='民宿')
    name = models.CharField('房型名称', max_length=100)
    description = models.TextField('描述', blank=True)
    max_guests = models.IntegerField('最多入住人数', default=2)
    base_price = models.DecimalField('基础价格', max_digits=10, decimal_places=2, default=0)
    area = models.DecimalField('面积(㎡)', max_digits=6, decimal_places=1, null=True, blank=True)
    bed_type = models.CharField('床型', max_length=50, blank=True)
    cover_image = models.ImageField('封面图', upload_to='rooms/covers/', null=True, blank=True)
    is_active = models.BooleanField('是否启用', default=True)
    sort_order = models.IntegerField('排序', default=0)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'room'
        verbose_name = '房型'
        verbose_name_plural = '房型'
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return f'{self.property.name} - {self.name}'


class RoomAmenity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='amenities', verbose_name='房型')
    name = models.CharField('设施名称', max_length=50)
    icon = models.CharField('图标', max_length=50, blank=True)

    class Meta:
        db_table = 'room_amenity'
        verbose_name = '房型设施'
        verbose_name_plural = '房型设施'

    def __str__(self):
        return f'{self.room.name} - {self.name}'


class RoomImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='images', verbose_name='房型')
    image = models.ImageField('图片', upload_to='rooms/images/')
    caption = models.CharField('说明', max_length=100, blank=True)
    sort_order = models.IntegerField('排序', default=0)

    class Meta:
        db_table = 'room_image'
        verbose_name = '房型图片'
        verbose_name_plural = '房型图片'
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.room.name} - 图片'
