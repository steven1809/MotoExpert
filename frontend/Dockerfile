FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG REACT_APP_API_URL=http://localhost:3000
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ARG REACT_APP_WOMPI_PUBLIC_KEY
ENV REACT_APP_WOMPI_PUBLIC_KEY=$REACT_APP_WOMPI_PUBLIC_KEY
RUN npm run build
RUN npm install -g serve
EXPOSE 3001
CMD ["serve", "-s", "build", "-l", "3001"]