#########################################
# 1) BUILDER stage (Debian-based)
#    - Installs production Python deps
#    - Installs Node + npm, runs npm build
#    - Collects static files
FROM python:3.11-slim-bullseye AS devtest

# Install system packages needed for building + node + postgres client libs etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libpq-dev \
    curl \
    ca-certificates \
    sudo \
    gnupg \
    libheif-dev \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
&& apt-get install -y nodejs

# (Optional) Upgrade npm if you want:
RUN npm install -g npm@latest

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxi6 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    fonts-liberation \
    fonts-noto-color-emoji \
    chromium \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Add PostgreSQL APT repository for the latest PostgreSQL client
RUN echo "deb http://apt.postgresql.org/pub/repos/apt bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user, and app directory
RUN useradd -m pyuser

WORKDIR /home/pyuser/app
RUN chown -R pyuser:pyuser /home/pyuser/app
USER pyuser

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \ 
    DJANGO_ALLOW_ASYNC_UNSAFE=true \
    PATH="/home/pyuser/.local/bin:${PATH}"
    
# Install main production Python dependencies.
COPY --chown=pyuser:pyuser ./app/requirements.txt ./
RUN pip install --user -r requirements.txt

# Install Node dependencies & build static assets
COPY --chown=pyuser:pyuser ./app/package*.json ./
# Install in parent directory, to keep node_modules out of app, yet still functioning during dev
WORKDIR /home/pyuser
RUN ln -s app/package*.json .
RUN npm install
WORKDIR /home/pyuser/app

# Install test/dev-only Python packages
RUN pip install --user ipdb pytest pytest-django pytest-playwright factory-boy

# Install Playwright browsers (the Pythonic way)
RUN playwright install chromium

# Copy the rest of your app code and run the final build steps
COPY --chown=pyuser:pyuser ./app/ ./
RUN npm run build
RUN echo "Collecting static files.  DJANGO_DEBUG=$DJANGO_DEBUG"
RUN python manage.py collectstatic --noinput

# At this point, you have:
# - Production Python packages installed in /home/pyuser/.local
# - Dev & test Python packages installed
# - Built and minified static files in app/collectstatic
# - A working Django codebase ready to run

# Run tests (for development override this)
CMD ["pytest", "--maxfail=1", "--disable-warnings"]

#########################################
# 3) PRODUCTION stage (Alpine-based)
#    - Super minimal final container
FROM python:3.11-slim-bullseye AS production

# Install runtime dependencies (e.g., for Postgres)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libheif1 \
    && rm -rf /var/lib/apt/lists/*

# Create user + set workdir
RUN useradd -m pyuser
WORKDIR /home/pyuser/app

# Copy installed python packages and built app from builder stage
COPY --from=devtest /home/pyuser/.local /home/pyuser/.local
COPY --from=devtest /home/pyuser/app/main /home/pyuser/app/main
COPY --from=devtest /home/pyuser/app/config /home/pyuser/app/config
COPY --from=devtest /home/pyuser/app/templates /home/pyuser/app/templates
COPY --from=devtest /home/pyuser/app/manage.py /home/pyuser/app/manage.py
COPY --from=devtest /home/pyuser/app/start /home/pyuser/app/start
COPY --from=devtest /home/pyuser/app/collectstatic /home/pyuser/app/collectstatic
# Environment
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/pyuser/.local/bin:${PATH}"

USER pyuser
EXPOSE 3000

CMD ["/home/pyuser/app/start"]