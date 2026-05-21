FROM ultralytics/ultralytics:latest-cpu

WORKDIR /app

# Install only the extra dependencies
RUN pip install --no-cache-dir \
    fastapi \
    python-multipart \
    uvicorn[standard]

COPY . .

EXPOSE 8001

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]