# Django Template

## Setup

Run the setup script to configure your project name and `.env` plus `docker-compose.override.yml` for local development.

```
./setup
```

This will setup your .env and docker-compose.override.yml file for local development.

```
docker-compose up -d
```

see logs
```
docker-compose logs
```

Shell into the python app container
```
docker-compose exec app /bin/bash
```

To make typing these commands less tedious it helps to have docker aliases in your .bash_profile or similar
```
alias dc='docker-compose'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dcl='docker-compose logs'
```

Once in the app container you can run the django commands
```
python manage.py runserver 0.0.0.0:3000
``` 

To run with a production gunicorn server
```
./start
```

To run tests
```
pytest
```

To run playwright tests in headed mode
Start your x server (hint: `brew install xquartz` and permit your server)

```
pytest --headed
```

To debug your playwright tests
```
PWDEBUG=1 pytest --headed
```



# Deployment Instructions

For more detailed instructions, please refer to the following README files:

- [Deploy to AWS](deploy-aws-infra/pulumi/README.md)
- [Deploy to Render](deploy-render/README.md)
- [Deploy to Digital Ocean](deploy-do/README.md)