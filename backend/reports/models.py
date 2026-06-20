from django.db import models


class Report(models.Model):
    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=50)
    generated_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='reports/')

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f'{self.title} ({self.report_type})'
