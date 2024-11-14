FROM node:22.5.1

RUN npm install -g serve

WORKDIR /app 
ADD ./react_app/package*.json ./

RUN npm install 


ADD ./react_app/public ./public
ADD ./react_app/tailwind.config.js ./
ADD ./react_app/tsconfig.json ./
ADD ./react_app/src ./src

RUN npm run build 

EXPOSE 3000

CMD [ "serve", "-s", "build", "-l", "3000" ]