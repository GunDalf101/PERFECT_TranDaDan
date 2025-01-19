FROM python:3.11

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# RUN apt-get install linux-headers-$(uname -r)
WORKDIR /app

COPY req.txt /app/
RUN pip install --no-cache-dir -r req.txt

# COPY . /app/

CMD ["bash", "run.sh"]
