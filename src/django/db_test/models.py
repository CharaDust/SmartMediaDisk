from django.db import models

class TestItem(models.Model):
    name = models.CharField(max_length=100)
    value = models.IntegerField() # 用于存储 0-32767 的值
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name