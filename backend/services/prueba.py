import requests
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

url = "https://api-inference.huggingface.co/models/facebook/blenderbot-3B"
headers = {"Authorization": f"Bearer {os.getenv('HF_API_KEY')}"}
data = {"inputs": "Hola, cómo estás?", "parameters": {"max_new_tokens": 50}}

response = requests.post(url, headers=headers, json=data)

print("Código de estado:", response.status_code)
print("Respuesta:", response.text)
