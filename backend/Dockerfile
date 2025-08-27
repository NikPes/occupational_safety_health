FROM python:3.10.18-slim-bullseye

WORKDIR /app

# Установка системных зависимостей для сборки Python пакетов
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Обновляем pip для избежания предупреждений
RUN python -m pip install --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "main.py"]