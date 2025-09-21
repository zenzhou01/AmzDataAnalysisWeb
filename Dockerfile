FROM node:20 AS build
WORKDIR /app

# 拷贝依赖文件
COPY package*.json ./
RUN npm install

# 拷贝全部源码
COPY . .

# 构建
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]