import sys
sys.path.insert(0, '.')

from apps.ai_service.services.ai_generator import AIService

print('=== AI 生成服务测试 ===')
result = AIService.generate_reply(
    conversation_history=[{'role': 'user', 'content': '你好，我想咨询一下产品价格'}],
    prompt_content='你是一个客服助手',
    variables={'topic': '价格优惠'},
    model='gpt-4',
)
print(f'success:', result.get('success'))
print(f'model:', result.get('model'))
print(f'latency:', result.get('latency'), 's')
if result.get('success'):
    print('content preview:', result.get('content')[:150], '...')
    print('tokens:', result.get('tokens'))
else:
    print('error:', result.get('error_type'), '-', result.get('error_message'))

print()
print('=== 可用模型列表 ===')
models = AIService.get_available_models()
for m in models:
    print(f'  - {m["id"]} ({m["provider"]})')

print()
print('=== 健康检查 ===')
health = AIService.health_check()
print('status:', health['status'])
print('available_models:', health['available_models'])
