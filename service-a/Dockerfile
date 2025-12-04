FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN opentelemetry-bootstrap -a install

COPY app.py .

ENV FLASK_APP=app.py
CMD ["opentelemetry-instrument", "flask", "run", "--host=0.0.0.0"]
