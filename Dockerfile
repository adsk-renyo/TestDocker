FROM node:argon

RUN mkdir /usr/src/web
WORKDIR /usr/src/web
COPY web /usr/src/web

RUN npm install 
EXPOSE 8080

CMD ["npm", "start"]
