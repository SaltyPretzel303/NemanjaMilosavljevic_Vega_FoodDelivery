FROM python

WORKDIR /app

ADD ./backend/setup.py ./
RUN pip install . 

ADD ./backend/src ./src

ENV PYTHONPATH=. 

EXPOSE 80
# ENTRYPOINT ["python", "-u", "./src/api/api.py"]
ENTRYPOINT ["python", "-u", "./src/app.py"]