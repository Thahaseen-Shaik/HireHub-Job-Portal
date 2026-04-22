import json
with open('chat_dataset.json', 'r') as f:
    data = json.load(f)
print(f"Intent count: {len(data['intent'])}")
print(f"Question count: {len(data['question'])}")
print(f"Answer count: {len(data['answer'])}")
