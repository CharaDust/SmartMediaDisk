# 生产环境配置 - 优化过的
FROM nginx:alpine

# 设置维护者信息
LABEL maintainer="your-email@example.com"

# 创建非root用户（安全最佳实践）
RUN addgroup -g 1001 -S www-group && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G www-group -g www-data www-user

# 复制网页文件
COPY src/ /usr/share/nginx/html/

# 设置正确的权限
RUN chown -R www-user:www-group /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# 切换到非root用户
USER www-user

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]