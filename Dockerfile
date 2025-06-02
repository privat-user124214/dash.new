
# Verwende PHP mit Apache
FROM php:8.2-apache

# Apache Rewrite Modul aktivieren
RUN a2enmod rewrite

# .htaccess-Unterstützung aktivieren
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Abhängigkeiten installieren
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Projektdateien in den Webserver kopieren
COPY . /var/www/html/

# Eigentümer setzen (optional)
RUN chown -R www-data:www-data /var/www/html
