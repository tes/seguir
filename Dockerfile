FROM dockerfile/nodejs

COPY . /seguir
RUN cd /seguir; npm install

WORKDIR /seguir

EXPOSE 3000

CMD ["node", "server"]
