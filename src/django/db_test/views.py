from django.shortcuts import render
from django.http import JsonResponse
import random
from .models import TestItem

def test_database(request):
    """
    测试数据库功能：查询所有数据。
    """
    items = TestItem.objects.all()
    items_data = []
    for item in items:
        items_data.append({
            'id': item.id,
            'name': item.name,
            'value': item.value,
            'created_at': item.created_at.isoformat() # 转换为 ISO 格式字符串
        })

    # 返回 JSON 数据
    return JsonResponse({'items': items_data})

def create_item(request):
    """
    创建一个新的 TestItem。
    """
    # 生成 0-32767 之间的随机数
    random_value = random.randint(0, 32767)
    new_item = TestItem.objects.create(
        name=f"Item_{random.randint(1000, 9999)}",
        value=random_value
    )
    return JsonResponse({
        'message': f'Created item {new_item.name} with value {new_item.value}',
        'item_id': new_item.id
    })

def delete_all(request):
    """
    删除所有测试数据 (用于清理)。
    """
    deleted_count, _ = TestItem.objects.all().delete()
    return JsonResponse({'message': f'Deleted {deleted_count} items.'})